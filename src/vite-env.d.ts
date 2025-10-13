/// <reference types="vite/client" />
/// <reference types="codemirror" />
/// <reference types='codemirror/addon/comment/comment' />
/// <reference types="codemirror/addon/display/placeholder" />
/// <reference types='codemirror/addon/display/autorefresh' />
/// <reference types='codemirror/addon/display/fullscreen' />
/// <reference types='codemirror/addon/display/rulers' />
/// <reference types='codemirror/addon/edit/closebrackets' />
/// <reference types='codemirror/addon/edit/closetag' />
/// <reference types='codemirror/addon/edit/matchbrackets' />
/// <reference types='codemirror/addon/edit/matchtags' />
/// <reference types='codemirror/addon/edit/trailingspace' />
/// <reference types='codemirror/addon/fold/foldcode' />
/// <reference types='codemirror/addon/fold/foldgutter' />
/// <reference types='codemirror/addon/fold/indent-fold' />
/// <reference types='codemirror/addon/hint/show-hint' />
/// <reference types='codemirror/addon/lint/lint' />
/// <reference types='codemirror/addon/search/search' />
/// <reference types='codemirror/addon/scroll/annotatescrollbar' />
/// <reference types='codemirror/addon/scroll/scrollpastend' />
/// <reference types='codemirror/addon/scroll/simplescrollbars' />
/// <reference types='codemirror/addon/search/match-highlighter' />
/// <reference types='codemirror/addon/selection/active-line' />
/// <reference types='codemirror/addon/selection/mark-selection' />
/// <reference types='codemirror/addon/selection/selection-pointer' />

import type { MKLibController } from './utils/lib';

declare module 'codemirror' {
  const __mk_libs__: MKLibController;
  const Init: { toString: () => 'CodeMirror.Init' };

  interface CommandsKeyMap extends KeyMap {
    [keyName: string]:
      | false
      | keyof CommandActions
      | ((instance: Editor) => void | typeof Pass);
  }
}

declare global {
  interface Window {
    CodeMirror: typeof CodeMirror;
  }
}
