import { loadExtensions } from './extensions';
import { createElement } from './utils/dom';
import { MKLibController } from './utils/lib';
import { loadLibFromOption } from './utils/loadLibFromOption';

import './plugins/optionPlus';
import './plugins/tokenHover';

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

  // const dummyOptions: Partial<CodeMirror.EditorConfiguration> = {};
  let defaultIndentSize = 2;
  if (options?.mode === 'python') defaultIndentSize = 4;

  const finalOptions: Partial<CodeMirror.EditorConfiguration> = {
    lineNumbers: true,
    tabSize: options?.indentSize ?? defaultIndentSize,
    indentUnit: options?.indentSize ?? defaultIndentSize,

    ...options,
  };

  const setupEditorFn = await loadLibFromOption(
    window.CodeMirror.__mk_libs__,
    finalOptions
  );

  const editor = window.CodeMirror.fromTextArea(textarea, finalOptions);
  await setupEditorFn(editor);

  if (options?.value) editor.setValue(options.value as string);

  // plugins enable

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
