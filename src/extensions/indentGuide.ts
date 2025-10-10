import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement, createStyle } from '@/utils/dom';

import type CodeMirror from 'codemirror';

const indentGuideClass = 'cm-indent-guide';
const indentGuideCSS = `$css
  :root {
    --cm-indent-guide-color: #e0e0e0;
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
      var(--cm-indent-guide-color) 0,
      var(--cm-indent-guide-color) 1px,
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

  let spaceCount = 0;
  let indentLevel = 0;

  for (const char of text) {
    if (char === ' ') {
      spaceCount++;
    } else if (char === '\t') {
      indentLevel += 1;
    } else {
      break;
    }
  }

  indentLevel += Math.ceil(spaceCount / indentUnit);

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
  guide.style.setProperty('--indent-size', indentUnit * charWidth + 'px');
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
