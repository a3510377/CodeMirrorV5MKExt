const handleGutterClick = (
  editor: CodeMirror.Editor,
  line: number,
  _gutter: string,
  event: Event
) => {
  // only respond to clicks on line numbers
  if (
    !(
      event instanceof MouseEvent &&
      event.target instanceof HTMLElement &&
      event.target.className.includes('CodeMirror-linenumber')
    )
  ) {
    return;
  }

  const start = { line, ch: 0 };
  const end = { line: line + 1, ch: 0 };

  if (!(event.ctrlKey || event.metaKey)) {
    editor.setSelection(start, end);
    return;
  }

  let alreadySelected = false;
  const newRanges: {
    anchor: CodeMirror.Position;
    head: CodeMirror.Position;
  }[] = editor.listSelections().filter(({ anchor, head }) => {
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
  editor.setSelections(newRanges);
};

export const clickLineSelect = () => {
  window.CodeMirror.defineOptionPlus('clickLineSelect', true, (editor) => {
    editor.on('gutterClick', handleGutterClick);
    return () => {
      editor.off('gutterClick', handleGutterClick);
    };
  });
};
declare module 'codemirror' {
  interface EditorConfiguration {
    clickLineSelect?: boolean;
  }
}
