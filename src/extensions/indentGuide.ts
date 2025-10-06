import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement } from '@/utils/dom';

import { type BaseExtension } from '.';

const indentGuideClass = 'cm-indent-guide';
export const indentGuideExtension = {
  name: 'indentGuide',
  style: `$css
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
  `,
  start(editor) {
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
      let guide: HTMLSpanElement | null = elt.querySelector(
        `.${indentGuideClass}`
      );
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

    editor.on('renderLine', updateIndentGuide);
    editor.refresh();

    return () => {
      editor.off('renderLine', updateIndentGuide);
      editor.refresh();
    };
  },
} satisfies BaseExtension;
