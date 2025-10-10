import autoprefixer from 'autoprefixer';
import { minify as htmlMinify } from 'html-minifier';
import * as lightningcss from 'lightningcss';
import path from 'path';
import postcss from 'postcss';
import { defineConfig } from 'vite';
import htmlFileMinify from 'vite-plugin-html-minifier';

export const baseConfig = {
  // TODO move to plugins dir
  plugins: [
    htmlFileMinify(),
    {
      name: 'vite-plugin-minify-html-css-template',
      enforce: 'pre',
      transform(code: string, id: string) {
        if (!id.endsWith('.ts') && !id.endsWith('.tsx')) return null;

        const newCode = code.replace(
          /`(?:\$?(html|css))?((?:\\`|[^`])*)`/g,
          (match, prefix: string, content: string) => {
            try {
              let minified = content;
              if (prefix === 'html') {
                minified = htmlMinify(content, {
                  collapseWhitespace: true,
                  removeComments: true,
                });
              } else if (prefix === 'css') {
                const variableMap = new Map<string, string>();

                content = content.replace(/\${\s*([^}]*)\s*}/g, (_, p1) => {
                  if (!p1) return '';
                  if (!variableMap.has(p1)) {
                    variableMap.set(
                      p1,
                      '__tmp_class_' + Math.random().toString(36).slice(2)
                    );
                  }
                  return variableMap.get(p1)!;
                });

                const cssString = lightningcss
                  .transform({
                    filename: '',
                    code: Buffer.from(content),
                    minify: true,
                  })
                  .code.toString();

                minified = postcss([
                  autoprefixer({
                    overrideBrowserslist: [
                      '> 0.5%',
                      'last 2 versions',
                      'not dead',
                    ],
                  }),
                ]).process(cssString).css;

                for (const [key, tmp] of variableMap.entries()) {
                  minified = minified.replace(
                    new RegExp(tmp, 'g'),
                    `\${${key}}`
                  );
                }
              } else return match;

              // FIXME safe for backticks in content
              return '`' + minified + '`';
            } catch (err) {
              console.warn('Failed to minify template string:', err);
              return match;
            }
          }
        );

        return newCode;
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#': path.resolve(__dirname, 'src/utils'),
      '~': path.resolve(__dirname, 'src/store'),
    },
  },
  build: {
    // minify: false,
    minify: 'terser',
    terserOptions: {
      mangle: true,
      compress: {
        drop_console: false,
        dead_code: false,
        keep_fnames: false,
        keep_classnames: false,
      },
      format: { comments: false },
    },
  },
} satisfies Parameters<typeof defineConfig>[0];

export default defineConfig(baseConfig);
