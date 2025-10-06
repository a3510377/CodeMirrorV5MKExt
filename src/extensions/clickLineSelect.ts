import type { BaseExtension } from '.';

window.CodeMirror.defineOption(
  'clickLineSelect',
  true,
  (editor, val: boolean, old: boolean) => {}
);

export const clickLineSelect = {
  name: 'clickLineSelect',
  start(editor) {
    editor.on('gutterClick', (cm, line, _, event) => {
      const start = { line, ch: 0 };
      const end = { line: line + 1, ch: 0 };

      const mouseEvent = event as MouseEvent;
      if (!(mouseEvent.ctrlKey || mouseEvent.metaKey)) {
        cm.setSelection(start, end);
        return;
      }

      let alreadySelected = false;
      const newRanges: {
        anchor: CodeMirror.Position;
        head: CodeMirror.Position;
      }[] = cm.listSelections().filter(({ anchor, head }) => {
        const from = Math.min(anchor.line, head.line);
        const to = Math.max(anchor.line, head.line);

        if (line >= from && line <= to) {
          alreadySelected = true;
          return false;
        }
        return true;
      });

      if (!alreadySelected) {
        newRanges.push({ anchor: start, head: end });
      }
      cm.setSelections(newRanges);
    });
  },
} satisfies BaseExtension;
