/// <reference types="vite/client" />
import type { MKLibController } from './utils/lib';
import type { PromiseOrNot } from './utils/type';

import type CodeMirror from 'codemirror';

declare module 'codemirror' {
  const __mk_libs__: MKLibController;
  interface Editor {
    __mk_ext_closes__?: Map<string, (() => PromiseOrNot<void>) | null>;
  }
}

declare global {
  interface Window {
    CodeMirror: typeof CodeMirror;
  }
}
