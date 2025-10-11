import type { LibName, MKLibController } from '@/utils/lib';

const optionLibMap: {
  [key: string]: OptionLibMapValue;
} = {
  mode: { python: 'mode/python/python' },
  continueComments: 'addon/comment/comment',
  autoRefresh: 'addon/display/autorefresh',
  fullScreen: 'addon/display/fullscreen',
  placeholder: 'addon/display/placeholder',
  rules: 'addon/display/rulers',
  autoCloseBrackets: 'addon/edit/closebrackets',
  autoCloseTags: 'addon/edit/closetag',
  matchBrackets: 'addon/edit/matchbrackets',
  matchTags: 'addon/edit/matchtags',
  showTrailingSpaces: 'addon/edit/trailingspace',
  foldGutter: [
    'addon/fold/foldcode',
    'addon/fold/foldgutter',
    'addon/fold/indent-fold',
  ],
  hintOptions: 'addon/hint/show-hint',
  lint: 'addon/lint/lint',
  search: 'addon/search/search',
  scrollButtonHeight: 'addon/scroll/annotatescrollbar',
  scrollPastEnd: 'addon/scroll/scrollpastend',
  highlightSelectionMatches: 'addon/search/match-highlighter',
  styleActiveLine: 'addon/selection/active-line',
  styleSelectedText: 'addon/selection/mark-selection',
  selectionPointer: 'addon/selection/selection-pointer',
  theme: { dracula: 'theme/dracula' },
};

export const loadLibFromOption = async (
  mkLibController: MKLibController,
  options: CodeMirror.EditorConfiguration
) => {
  const addLibFromNameOrArray = (lib: LibName | LibName[]) => {
    if (Array.isArray(lib)) {
      return Promise.all(lib.map((l) => mkLibController.addLib(l)));
    } else {
      return mkLibController.addLib(lib);
    }
  };

  const applyOption = async <T extends keyof CodeMirror.EditorConfiguration>(
    optionName: T,
    optionValue: CodeMirror.EditorConfiguration[T]
  ) => {
    const lib = optionLibMap[optionName];
    if (!lib) return;
    if (optionValue === undefined) return;

    if (typeof lib === 'string' || Array.isArray(lib)) {
      await addLibFromNameOrArray(lib);
    } else {
      if (
        typeof optionValue === 'string' &&
        optionValue in lib &&
        optionLibMap[optionName]
      ) {
        await addLibFromNameOrArray(lib[optionValue]);
      }
    }
  };

  const applyOptionFromEditor = async (
    editor: CodeMirror.Editor,
    optionName: keyof CodeMirror.EditorConfiguration
  ) => {
    await applyOption(
      optionName,
      editor.getOption(optionName as keyof CodeMirror.EditorConfiguration)
    );
  };

  await Promise.all(
    Object.keys(options).map((optionName) => {
      return applyOption(
        optionName as keyof CodeMirror.EditorConfiguration,
        options[optionName as keyof CodeMirror.EditorConfiguration]
      );
    })
  ).catch((err) => {
    console.error('Load libs from options failed:', err);
  });

  return async (editor: CodeMirror.Editor) => {
    editor.on('optionChange', applyOptionFromEditor);

    await Promise.all(
      Object.keys(optionLibMap).map((optionName) => {
        return applyOptionFromEditor(
          editor,
          optionName as keyof CodeMirror.EditorConfiguration
        );
      })
    );

    return () => {
      editor.off('optionChange', applyOptionFromEditor);
    };
  };
};

export type OptionLibMapValue =
  | LibName
  | LibName[]
  | { [k: string]: LibName | LibName[] };
