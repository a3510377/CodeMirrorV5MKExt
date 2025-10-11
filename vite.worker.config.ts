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
      outDir: 'dist/worker',
      lib: {
        entry: 'src/runner/python/index.ts',
        name: 'MKPyodideWorkerScript',
        fileName: 'MKPyodideWorkerScript',
        formats: ['iife', 'cjs'],
      },
    },
  })
);
