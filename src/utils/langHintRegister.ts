import { pythonHintNeedLibs } from '@/lang/python/hint';

const hintLibs = {
  ...pythonHintNeedLibs,
};

export const checkInstallHintLibs = async (
  options: CodeMirror.EditorConfiguration
) => {
  if (!options?.hintOptions) return;

  await window.CodeMirror.__mk_libs__.addLib('addon/hint/show-hint');

  const mode = options.mode as string;
  if (mode in hintLibs) {
    const libs = hintLibs[mode as keyof typeof hintLibs];
    if (libs && libs.length > 0) {
      for (const lib of libs) {
        await window.CodeMirror.__mk_libs__.addLib(lib);
      }
    }
  }
};
