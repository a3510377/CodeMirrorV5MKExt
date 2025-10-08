/// <reference types="vite/client" />
import type { MKLibController } from './utils/lib';

import type CodeMirror from 'codemirror';

declare module 'codemirror' {
  const __mk_libs__: MKLibController;
  const Init: { toString: () => 'CodeMirror.Init' };
}

declare global {
  interface Window {
    CodeMirror: typeof CodeMirror;
  }
}
