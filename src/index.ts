import { DEFAULT_INDENT_UNIT, PYTHON_INDENT_UNIT } from './constants';
import { loadExtensions } from './extensions';
import { createElement } from './utils/dom';
import { MKLibController } from './utils/lib';
import { loadLibFromOption } from './utils/loadLibFromOption';

import './plugins/optionPlus';
import './plugins/tokenHover';
import type CodeMirror from 'codemirror';

const libController = new MKLibController();

// @ts-ignore
window.CodeMirror.__mk_libs__ = libController;

loadExtensions();

export const createEditor = async (options?: CreateEditorOptions) => {
  const editorContainer =
    options?.container ?? createElement('div', 'editor-container');
  const textarea = createElement('textarea', 'editor-textarea');

  textarea.id = options?.textareaID ?? 'code-editor-textarea';
  editorContainer.appendChild(textarea);
  editorContainer.classList.add(`${options?.mode}-mode`);
  options?.parent?.appendChild(editorContainer);

  let defaultIndentSize = DEFAULT_INDENT_UNIT;
  if (options?.mode === 'python') defaultIndentSize = PYTHON_INDENT_UNIT;

  const finalOptions: Partial<CodeMirror.EditorConfiguration> = {
    lineNumbers: true,
    tabSize: options?.indentSize ?? defaultIndentSize,
    indentUnit: options?.indentSize ?? defaultIndentSize,
    theme: 'dracula',

    // Enable line wrapping automatically
    // lineWrapping: true,
    // Show cursor when text is selected
    showCursorWhenSelecting: true,

    // Placeholder text
    placeholder: 'Start coding...',
    // Highlight matching brackets
    matchBrackets: true,
    // Highlight the active line
    styleActiveLine: true,
    // Highlight selected text
    styleSelectedText: true,
    // Automatically close brackets
    autoCloseBrackets: true,
    // Highlight all occurrences of the selected word
    highlightSelectionMatches: {
      showToken: /\w/,
      annotateScrollbar: true,
    },
    // Code completion configuration
    hintOptions: { completeSingle: false },

    // Code folding
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],

    ...options,

    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Ctrl-/': 'toggleComment',
      'Shift-Tab': 'indentLess',

      Tab: 'mkTab',
      Enter: 'mkNewlineAndIndent',
      'Ctrl-Alt-Up': 'mkMoveCursorsUp',
      'Ctrl-Alt-Down': 'mkMoveCursorsDown',
      'Ctrl-D': 'mkSelectNextOccurrence',
      'Shift-Ctrl-L': 'mkSelectAllOccurrences',
      'Alt-Up': 'mkSwapLineUp',
      'Alt-Down': 'mkSwapLineDown',
      'Ctrl-G': 'mkJumpToLine',
    } as const satisfies CodeMirror.CommandsKeyMap,
  };

  // TODO: Load libraries based on options (short key)
  await libController.addLib('addon/dialog/dialog');
  await libController.addLib('addon/comment/comment');
  await libController.addLib('addon/search/searchcursor');

  const setupEditorFn = await loadLibFromOption(libController, finalOptions);

  const editor = window.CodeMirror.fromTextArea(textarea, finalOptions);
  await setupEditorFn(editor);

  if (options?.value) {
    editor.setValue(options.value as string);
    editor.clearHistory();
  }

  editor.refresh();

  return { editor, libController };
};

export interface CreateEditorOptions
  extends Partial<CodeMirror.EditorConfiguration> {
  indentSize?: number;
  parent?: HTMLElement;
  container?: HTMLElement;
  textareaID?: string;
}
