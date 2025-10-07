import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement, createStyle } from '@/utils/dom';

import type CodeMirror from 'codemirror';

const indentGuideClass = 'cm-indent-guide';
const indentGuideCSS = `$css
  :root {
    --mk-indent-guide-color: #e0e0e0;
  }

  .${MK_CUSTOM_COMPONENT}.${indentGuideClass} {
    position: absolute;
    top: 0;
    left: 3px;
    bottom: 0;
    width: var(--indent-width);
    pointer-events: none;
    background-image: repeating-linear-gradient(
      to right,
      var(--mk-indent-guide-color) 0,
      var(--mk-indent-guide-color) 1px,
      transparent 1px,
      transparent 100%
    );
    background-size: var(--indent-size) 100%;
  }
`;

const updateIndentGuide = (
  cm: CodeMirror.Editor,
  line: CodeMirror.LineHandle,
  elt: HTMLElement
) => {
  const text = line.text;
  const indentUnit = cm.getOption('indentUnit') ?? 2;
  const indentLevel = Math.ceil(text.search(/\S|$/) / indentUnit) ?? 16;

  if (elt.dataset.indentLevel === indentLevel.toString()) return;

  elt.dataset.indentLevel = indentLevel.toString();
  let guide: HTMLSpanElement | null = elt.querySelector(`.${indentGuideClass}`);
  if (!guide) {
    guide = createElement('span', indentGuideClass);
    elt.appendChild(guide);
  }

  const charWidth = cm.defaultCharWidth();
  guide.style.setProperty(
    '--indent-width',
    indentUnit * indentLevel * charWidth + 'px'
  );
  guide.style.setProperty('--indent-size', charWidth * indentUnit + 'px');
};

export const indentGuide = () => {
  window.CodeMirror.defineOptionPlus('indentGuide', true, (editor) => {
    const styleEl = createStyle(indentGuideCSS);
    styleEl.classList.add(indentGuideClass);

    editor.on('renderLine', updateIndentGuide);

    return () => {
      styleEl.remove();
      editor.off('renderLine', updateIndentGuide);
    };
  });
};

declare module 'codemirror' {
  interface EditorConfiguration {
    indentGuide?: boolean;
  }
}
