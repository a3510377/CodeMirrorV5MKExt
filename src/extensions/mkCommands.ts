import { PYTHON_INDENT_UNIT } from '@/constants';

export const mkNewlineAndIndent = (cm: CodeMirror.Editor) => {
  const doc = cm.getDoc();
  const selects = cm.listSelections();

  for (let i = selects.length - 1; i >= 0; i--) {
    const { head, anchor } = selects[i];
    const line = doc.getLine(head.line);
    const currentLineIndent = line.match(/^\s*/)?.[0] ?? '';
    const currentSize = currentLineIndent.length;
    const isPython = cm.getMode().name === 'python';
    const atIndentEnd = head.ch === currentSize;
    const trimmed = line.trim();

    // Get language mode and compute indentation level
    const currentLineStatus = cm.getStateAfter(head.line);
    const langIndent =
      cm.getMode().indent?.(currentLineStatus, line, currentLineIndent) ?? 0;

    // Insert newline
    doc.replaceRange(doc.lineSeparator(), anchor, head, 'input');

    let indentSize;
    if (isPython) {
      // Python special case: break / continue / pass... -> dedent one level
      const dedentKeywords = [
        'break',
        'continue',
        'pass',
        'return',
        'raise',
        'yield',
      ];
      const isDedent = dedentKeywords.some((k) => trimmed.startsWith(k));
      const indentUnit = cm.getOption('indentUnit') ?? PYTHON_INDENT_UNIT;

      // Dedent keyword -> dedent one level
      if (isDedent) indentSize = Math.max(langIndent - indentUnit, 0);
      // Line ends with colon -> indent one level
      else if (trimmed.endsWith(':')) indentSize = langIndent;
      // Cursor is at the end of indentation -> keep or revert to computed indent
      else if (atIndentEnd) {
        if (currentSize <= langIndent) indentSize = currentSize;
        else indentSize = langIndent - indentUnit;
      }
      // Empty line -> revert to previous indentation level
      else if (!trimmed) {
        indentSize = Math.max(langIndent - indentUnit, 0);
      }
      // Cursor is in the middle of code -> keep current indent
      else indentSize = currentSize;
    } else {
      // Non-Python language -> use language indentation; keep current indent if cursor in middle
      if (atIndentEnd) {
        indentSize = currentSize <= langIndent ? currentSize : langIndent;
      } else {
        indentSize = line.trim() ? currentSize : langIndent;
      }
    }

    // Insert computed indentation
    const tabSize = cm.getOption('tabSize') ?? 4;
    const indentStr = cm.getOption('indentWithTabs')
      ? '\t'.repeat(Math.floor(indentSize / tabSize)) +
        ' '.repeat(indentSize % tabSize)
      : ' '.repeat(indentSize);
    doc.replaceRange(indentStr, doc.getCursor(), undefined, 'input');

    // Ensure cursor is visible after operation
    cm.scrollIntoView(null, 0);

    // If the line contains only whitespace -> clear it
    if (head.line === anchor.line && !trimmed) {
      doc.replaceRange(
        '',
        { line: head.line, ch: 0 },
        { line: head.line, ch: head.ch },
        'input'
      );
    }
  }
};

export const mkMoveCursors = (cm: CodeMirror.Editor, dir: 1 | -1) => {
  const ranges = cm.listSelections();
  const newRanges = ranges.map((r) => {
    if (dir < 0 && r.head.line > 0) {
      return {
        head: { line: r.head.line - 1, ch: r.head.ch },
        anchor: { line: r.anchor.line - 1, ch: r.anchor.ch },
      };
    } else if (dir > 0 && r.head.line < cm.lineCount() - 1) {
      return {
        head: { line: r.head.line + 1, ch: r.head.ch },
        anchor: { line: r.anchor.line + 1, ch: r.anchor.ch },
      };
    }
    return r;
  });
  cm.setSelections([...ranges, ...newRanges]);
};

export const mkSelectNextOccurrence = (cm: CodeMirror.Editor) => {
  cm.listSelections().forEach(({ anchor, head }) => {
    const word = cm.getRange(anchor, head);
    if (word) {
      const cursor = cm.getSearchCursor(word, head);

      if (cursor.findNext()) cm.addSelection(cursor.from(), cursor.to());
      else {
        const cursor = cm.getSearchCursor(word, { line: 0, ch: 0 });
        if (cursor.findNext()) {
          cm.addSelection(cursor.from(), cursor.to());
        }
      }
    } else {
      const lineText = cm.getLine(head.line);

      let left = head.ch;
      let right = left;

      while (left > 0 && /\w/.test(lineText[left - 1])) left--;
      while (right < lineText.length && /\w/.test(lineText[right])) {
        right++;
      }

      cm.setSelection(
        { line: head.line, ch: left },
        { line: head.line, ch: right }
      );
    }
  });
};

export const mkSelectAllOccurrences = (cm: CodeMirror.Editor) => {
  cm.listSelections().forEach(({ anchor, head }) => {
    if (head.ch === anchor.ch && head.line === anchor.line) {
      const lineText = cm.getLine(head.line);
      let left = head.ch;
      let right = head.ch;
      while (left > 0 && /\w/.test(lineText[left - 1])) left--;
      while (right < lineText.length && /\w/.test(lineText[right])) {
        right++;
      }

      head = { line: head.line, ch: right };
      anchor = { line: head.line, ch: left };
      cm.setSelection(anchor, head);
    }

    const word = cm.getRange(anchor, head);
    const cursor = cm.getSearchCursor(word, { line: 0, ch: 0 });
    while (cursor.findNext()) {
      cm.addSelection(cursor.from(), cursor.to());
    }
  });
};

export const mkSwapLine = (cm: CodeMirror.Editor, dir: 1 | -1) => {
  const lineCount = cm.lineCount();
  let ranges = cm.listSelections();

  const linesToSwap = [
    ...new Set(ranges.map((r) => [r.head.line, r.anchor.line]).flat()),
  ];

  // When moving down, swap from bottom to top; when moving up, swap from top to bottom
  linesToSwap.sort((a, b) => (dir > 0 ? b - a : a - b));
  linesToSwap.forEach((line) => {
    const targetLine = line + dir;
    if (targetLine < 0 || targetLine >= lineCount) return;

    const currentLineText = cm.getLine(line);
    const targetLineText = cm.getLine(targetLine);

    cm.replaceRange(
      currentLineText,
      { line: targetLine, ch: 0 },
      { line: targetLine, ch: targetLineText.length }
    );

    cm.replaceRange(
      targetLineText,
      { line: line, ch: 0 },
      { line: line, ch: currentLineText.length }
    );
  });

  const newSelections = ranges.map((r) => ({
    head: { line: r.head.line + dir, ch: r.head.ch },
    anchor: { line: r.anchor.line + dir, ch: r.anchor.ch },
  }));
  cm.setSelections(newSelections);
};

// Jump to line
// edit from: https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.20/addon/search/jump-to-line.js
export const mkJumpToLine = (cm: CodeMirror.Editor) => {
  const cur = cm.getCursor();

  const interpretLine = (str: string) => {
    const num = +str;
    return /^[-+]/.test(str) ? cur.line + num : num - 1;
  };

  cm.openDialog(
    `Jump to line: <input type='text' style='width: 10em' class='CodeMirror-search-field'/><span style='color:#888' class='CodeMirror-search-hint'>(You can use line:column or line)</span>`,
    (posStr) => {
      if (!posStr) return;

      let match;
      if ((match = /^\s*([-+]?\d+)\s*:\s*(\d+)\s*$/.exec(posStr))) {
        cm.setCursor(interpretLine(match[1]), Number(match[2]));
      } else if ((match = /^\s*:?\s*([-+]?\d+)\s*/.exec(posStr))) {
        cm.setCursor(interpretLine(match[1]), cur.ch);
      }
    },
    // @ts-ignore
    { value: `${cur.line + 1}:${cur.ch}` }
  );
};

const customCommands = {
  mkNewlineAndIndent,
  mkTab: (cm: CodeMirror.Editor) => {
    if (cm.somethingSelected()) cm.indentSelection('add');
    else {
      cm.replaceSelection(
        ' '.repeat(cm.getOption('indentUnit') ?? 2),
        'end',
        '+input'
      );
    }
  },
  mkMoveCursorsUp: (cm: CodeMirror.Editor) => mkMoveCursors(cm, -1),
  mkMoveCursorsDown: (cm: CodeMirror.Editor) => mkMoveCursors(cm, 1),
  mkSelectNextOccurrence,
  mkSelectAllOccurrences,
  mkSwapLineUp: (cm: CodeMirror.Editor) => mkSwapLine(cm, -1),
  mkSwapLineDown: (cm: CodeMirror.Editor) => mkSwapLine(cm, 1),
  mkJumpToLine,
} satisfies BaseCustomCommands;

export const registerMKCommands = () => {
  Object.assign(window.CodeMirror.commands, customCommands);

  return () => {
    Object.keys(customCommands).forEach((name) => {
      delete window.CodeMirror.commands[
        name as keyof CodeMirror.CommandActions
      ];
    });
  };
};

type BaseCustomCommands = { [key: string]: (cm: CodeMirror.Editor) => void };

type CustomCommands = {
  [K in keyof typeof customCommands]: (cm: CodeMirror.Editor) => void;
};

declare module 'codemirror' {
  interface CommandActions extends CustomCommands {}
}
