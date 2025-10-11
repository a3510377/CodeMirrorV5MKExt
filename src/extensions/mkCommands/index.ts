import {
  mkJumpToLine,
  mkMoveCursors,
  mkSelectAllOccurrences,
  mkSelectNextOccurrence,
  mkSwapLine,
} from './mkCursor';
import { mkNewlineAndIndent } from './mkNewlineAndIndent';

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
        name as keyof typeof window.CodeMirror.commands
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
