import type { LibName } from '@/utils/lib';
import type { PromiseOrNot } from '@/utils/type';

import { clickLineSelect } from './clickLineSelect';
import { indentGuideExtension } from './indentGuide';
import { specialCharsShow } from './specialCharsShow';
import { attachStatusBar } from './statusbar';

export const registerExtensionToOption = (
  editor: CodeMirror.Editor,
  options: string[],
  elements: EditorElements
) => {
  editor.on('optionChange', async (cm, option) => {
    const value = cm.getOption(option as keyof CodeMirror.EditorConfiguration);
    if (value) {
      const ext = baseExtensionMap.get(option);
      if (ext) {
        cm.__mk_ext_closes__ ??= new Map();
        const oldCloseFn = cm.__mk_ext_closes__.get(option);
        // enable again, do nothing
        if (oldCloseFn !== undefined) {
          return;
        }

        const closeFn = await ext.start?.(cm, window.CodeMirror, elements);
        cm.__mk_ext_closes__.set(option, closeFn ?? null);
      }
    } else {
      await editor.__mk_ext_closes__?.get(option)?.();
      editor.__mk_ext_closes__?.delete(option);
    }
  });

  // initial enable
  Object.keys(options).forEach((option) => {
    if (editor.getOption(option as keyof CodeMirror.EditorConfiguration)) {
      editor.setOption(option as keyof CodeMirror.EditorConfiguration, true);
    }
  });
};

export const baseExtensions: BaseExtension[] = [
  clickLineSelect,
  indentGuideExtension,
  specialCharsShow,
  attachStatusBar,
];
export const baseExtensionMap = new Map(
  baseExtensions.map((ext) => [ext.name, ext])
);

export interface BaseExtension {
  name: string;
  start: (
    editor: CodeMirror.Editor,
    codeMirror: typeof window.CodeMirror,
    elements: EditorElements
  ) => PromiseOrNot<(() => PromiseOrNot<void>) | void>;
  style?: string;
  libs?: LibName[];
}

export interface EditorElements {
  container: HTMLElement;
  textarea: HTMLTextAreaElement;
}

const test = async () => {};
