import type { HintLibInfos } from '@/utils/langHintRegister';

export const pythonAnywordHint = ((cm) => {
  const cursor = cm.getCursor();
  const token = cm.getTokenAt(cursor);
  const word = token.string.slice(0, cursor.ch - token.start);
  const pythonHints = (window.CodeMirror.hintWords['python'] || []).filter(
    (k) => k.startsWith(word)
  );
  const anywordHints = window.CodeMirror.hint.anyword?.(cm)?.list || [];

  return {
    list: [...new Set([...pythonHints, ...anywordHints])].map((text) => ({
      text,
    })),
    from: { line: cursor.line, ch: token.start },
    to: { line: cursor.line, ch: token.end },
  };
}) as CodeMirror.HintFunction;

export const pythonHintConfig = {
  python: {
    hint: pythonAnywordHint,
    libs: ['addon/hint/anyword-hint'],
  },
} as const satisfies HintLibInfos;

export default pythonAnywordHint;

declare module 'codemirror' {
  const hintWords: HintWords;

  interface HintWords {
    python: string[];
  }

  interface HintHelpers {
    anyword?: (cm: Editor) => Hints | undefined;
  }
}
