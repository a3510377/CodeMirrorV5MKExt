import { baseConfig } from './vite.base.config.js';

import { defineConfig, mergeConfig } from 'vite';

export default mergeConfig(
  baseConfig,
  defineConfig({
    worker: {
      rollupOptions: {
        output: {
          entryFileNames: 'MKPyodideWorker.js',
          inlineDynamicImports: true,
        },
      },
    },
    build: {
      ...baseConfig.build,
      outDir: 'dist/worker',
      lib: {
        entry: 'src/runner/python/index.ts',
        name: 'MKCodeMirror5Worker',
        fileName: 'MKCodeMirror5Worker',
        formats: ['iife', 'cjs'],
      },
    },
  })
);
