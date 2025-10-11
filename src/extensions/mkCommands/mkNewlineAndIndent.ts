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
