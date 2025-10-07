import { createStyle } from '@/utils/dom';
import type { LibName } from '@/utils/lib';
import type { PromiseOrNot } from '@/utils/type';

window.CodeMirror.defineOptionPlus = function (
  name,
  default_,
  updateFunc,
  options
) {
  options = { autoDispose: true, ...options };

  window.CodeMirror.defineOption(name, default_, async (cm, val, old) => {
    // eslint-disable-next-line eqeqeq
    if (old == window.CodeMirror.Init) old = null;

    console.log(`[OptionPlus:${name}]`, { val, old });

    cm.__optionPlus__ ??= { dispose: {} };

    const disposes = cm.__optionPlus__.dispose;
    const context: PlusOptionContext = {
      name,
      async dispose() {
        const list = disposes[name];
        if (!list) return;
        await Promise.all(list.map((fn) => fn()));
        delete disposes[name];
      },
      addDispose(fn) {
        disposes[name] ??= [];
        disposes[name].push(fn);
      },
      setDispose(fn) {
        disposes[name] = [fn];
      },
      clearDispose() {
        delete disposes[name];
      },
    };

    try {
      if (options?.autoDispose) {
        if (old !== null && !val) {
          await context.dispose();
          return;
        }
      }

      if (options?.libs?.length) {
        await Promise.all(
          options.libs.map((lib) => {
            return window.CodeMirror.__mk_libs__.addLib(lib);
          })
        );
      }

      const result = await updateFunc.call(cm, cm, val, old, context);
      if (typeof result === 'function') {
        context.addDispose(result);
      }

      if (val && options?.css) {
        const style = createStyle(options.css);
        context.addDispose(() => style.remove());
      }
    } catch (err) {
      console.error(`[OptionPlus:${name}] execution failed:`, err);
    }
  });
};

export interface PlusOptionContext {
  name: string;
  dispose(): Promise<void>;
  addDispose(fn: () => PromiseOrNot<void>): void;
  setDispose(fn: () => PromiseOrNot<void>): void;
  clearDispose(): void;
}

export interface PlusOptionHandler<
  T extends keyof CodeMirror.EditorConfiguration = keyof CodeMirror.EditorConfiguration
> {
  (
    this: CodeMirror.Editor,
    editor: CodeMirror.Editor,
    value: CodeMirror.EditorConfiguration[T],
    oldValue: CodeMirror.EditorConfiguration[T],
    context: PlusOptionContext
  ): PromiseOrNot<void | (() => PromiseOrNot<void>)>;
}

declare module 'codemirror' {
  function defineOptionPlus<T extends keyof EditorConfiguration>(
    name: T,
    default_: EditorConfiguration[T],
    updateFunc: PlusOptionHandler<T>,
    options?: {
      css?: string;
      libs?: LibName[];
      autoDispose?: boolean;
    }
  ): void;

  interface Editor {
    __optionPlus__?: { dispose: Record<string, (() => PromiseOrNot<void>)[]> };
  }
}
