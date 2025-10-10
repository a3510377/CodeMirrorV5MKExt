import { baseConfig } from './vite.base.config.js';

import { defineConfig, mergeConfig } from 'vite';

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'src/index.ts',
        name: 'MKCodeMirror5',
        fileName: 'MKCodeMirror5',
        formats: ['iife', 'cjs'],
      },
    },
  })
);
