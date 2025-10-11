import { mkNewlineAndIndent } from './mkNewlineAndIndent';

const customCommands = {
  mkNewlineAndIndent,
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
