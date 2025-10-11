import { loadExtensions } from './extensions';
import { createElement } from './utils/dom';
import { MKLibController } from './utils/lib';
import { loadLibFromOption } from './utils/loadLibFromOption';

import './plugins/optionPlus';
import './plugins/tokenHover';
import type CodeMirror from 'codemirror';

// @ts-ignore
window.CodeMirror.__mk_libs__ = new MKLibController();

loadExtensions();

export const createEditor = async (options?: CreateEditorOptions) => {
  const editorContainer =
    options?.container ?? createElement('div', 'editor-container');
  const textarea = createElement('textarea', 'editor-textarea');

  textarea.id = options?.textareaID ?? 'code-editor-textarea';
  editorContainer.appendChild(textarea);
  editorContainer.classList.add(`${options?.mode}-mode`);
  options?.parent?.appendChild(editorContainer);

  let defaultIndentSize = 2;
  if (options?.mode === 'python') defaultIndentSize = 4;

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
    placeholder: '打這裡！！',
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

    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Cmd-Space': 'autocomplete',
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment',
      Tab: 'indentMore',
      'Shift-Tab': 'indentLess',
      Enter: 'mkNewlineAndIndent',

      // 'Ctrl-F': 'findPersistent',
      // 'Cmd-F': 'findPersistent',
      // 'Ctrl-G': 'findNext',
      // 'Cmd-G': 'findNext',
      // 'Shift-Ctrl-G': 'findPrev',
      // 'Shift-Cmd-G': 'findPrev',
    } as const satisfies CodeMirror.CommandsKeyMap,

    // Code folding
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],

    ...options,
  };

  const setupEditorFn = await loadLibFromOption(
    window.CodeMirror.__mk_libs__,
    finalOptions
  );

  const editor = window.CodeMirror.fromTextArea(textarea, finalOptions);
  await setupEditorFn(editor);

  if (options?.value) {
    editor.setValue(options.value as string);
    editor.clearHistory();
  }

  editor.refresh();

  return { editor, libController: window.CodeMirror.__mk_libs__ };
};

export interface CreateEditorOptions
  extends Partial<CodeMirror.EditorConfiguration> {
  indentSize?: number;
  parent?: HTMLElement;
  container?: HTMLElement;
  textareaID?: string;
}
