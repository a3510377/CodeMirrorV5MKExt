import { pythonHintConfig } from '@/lang/python/hint';

import type { LibName } from './lib';
import { debounce } from './utils';

const hintLibs = {
  ...pythonHintConfig,
} as const satisfies Record<string, HintLibInfo>;

export const checkInstallHintLibs = async (
  options: CodeMirror.EditorConfiguration
) => {
  if (!options?.hintOptions) return;

  await window.CodeMirror.__mk_libs__.addLib('addon/hint/show-hint');

  const mode = options.mode as string;
  if (mode in hintLibs) {
    const libs = hintLibs[mode as keyof typeof hintLibs].libs;
    if (libs && libs.length > 0) {
      for (const lib of libs) {
        await window.CodeMirror.__mk_libs__.addLib(lib);
      }
    }
  }
};

export const enableHint = (cm: CodeMirror.Editor, id: HintLibID) => {
  const debouncedShowHint = debounce((cm: CodeMirror.Editor) => {
    cm.showHint({
      hint: (id in hintLibs
        ? hintLibs[id as keyof typeof hintLibs].hint
        : window.CodeMirror.hint[
            id as keyof CodeMirror.HintHelpers
          ]) as CodeMirror.HintFunction,
      completeSingle: false,
    });
  }, 100);

  cm.on('inputRead', (cm, change) => {
    if (change.origin === '+input' && change.text?.[0]?.match(/\w/)) {
      debouncedShowHint(cm);
    }
  });
};

export interface HintLibInfo {
  hint: CodeMirror.HintFunction;
  libs?: LibName[];
}

export type HintLibInfos = Record<string, HintLibInfo>;
export type HintLibID = keyof typeof hintLibs | keyof CodeMirror.HintHelpers;
