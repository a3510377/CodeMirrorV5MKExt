import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement, createStyle } from '@/utils/dom';

const statusBarClass = 'cm-statusbar';

const statusBarCSS = `$css
  :root {
    --cm-statusbar-color: #555;
    --cm-statusbar-background: #f5f5f5;
  }

  .${MK_CUSTOM_COMPONENT}.${statusBarClass} {
    gap: 15px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: var(--cm-statusbar-color);
    background: var(--cm-statusbar-background);
    font-size: 12px;
    padding: 4px 10px;
    font-family: monospace;
  }
`;

export const statusbar = () => {
  window.CodeMirror.defineOptionPlus('statusbar', true, (editor) => {
    const styleEl = createStyle(statusBarCSS);
    styleEl.classList.add(statusBarClass);

    const statusBar = createElement('div', statusBarClass);
    statusBar.innerHTML = `$html
      <span>字數: <span id="char-count">0</span></span>
      <span>第 <span id="cursor-line">1</span> 行，第<span id="cursor-col">1</span> 欄
      <span id="selection" style="display:none">(已選取: <span id="selection-count">0</span>)</span>
    `;

    const charCount = statusBar.querySelector<HTMLSpanElement>('#char-count')!;
    const cursorCol = statusBar.querySelector<HTMLSpanElement>('#cursor-col')!;
    const cursorLine =
      statusBar.querySelector<HTMLSpanElement>('#cursor-line')!;
    const selection = statusBar.querySelector<HTMLSpanElement>('#selection')!;
    const selectionCount =
      statusBar.querySelector<HTMLSpanElement>('#selection-count')!;

    editor.getWrapperElement().appendChild(statusBar);

    const updateStatus = (editor: CodeMirror.Editor) => {
      const text = editor.getValue();
      const cursor = editor.getCursor();
      const selLength = editor.getSelection().length;

      charCount.textContent = `${text.length}`;
      cursorLine.textContent = `${cursor.line + 1}`;
      cursorCol.textContent = `${cursor.ch + 1}`;
      selectionCount.textContent = `${selLength}`;
      selection.style.display = selLength > 0 ? 'unset' : 'none';
    };

    editor.on('changes', updateStatus);
    editor.on('cursorActivity', updateStatus);
    updateStatus(editor);

    return () => {
      editor.off('changes', updateStatus);
      editor.off('cursorActivity', updateStatus);
      styleEl.remove();
      statusBar.remove();
    };
  });
};

declare module 'codemirror' {
  interface EditorConfiguration {
    statusbar?: boolean;
  }
}
