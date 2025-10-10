import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement, createStyle } from '@/utils/dom';

const Names: { [key: string]: string } = {
  0x0000: '空值',
  0x0007: '鈴聲',
  0x0008: '退格',
  0x000a: '換行',
  0x000b: '垂直制表符',
  0x000d: '回車',
  0x001b: '轉義',
  0x200b: '零寬空格',
  0x200c: '零寬非連字符',
  0x200d: '零寬連字符',
  0x200e: '從左到右標記',
  0x200f: '從右到左標記',
  0x2028: '行分隔符',
  0x202d: '從左到右覆蓋',
  0x202e: '從右到左覆蓋',
  0x2062: '從左到右隔離',
  0x2063: '從右到左隔離',
  0x2065: '彈出方向隔離符',
  0x2029: '段落分隔符',
  0xfeff: '零寬不換行空格',
  0xfffc: '物件替代符',
};

const specialCharsShowCSS = `$css
  :root {
    --cm-space-color: #dfdfdf;
  }

  .cm-tab {
    background-size: auto 100%;
    background-repeat: no-repeat;
    background-position: right 90%;
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='20'><path stroke='%23888' stroke-width='1' fill='none' d='M1 10H196L190 5M190 15L196 10M197 4L197 16'/></svg>");
  }

  .${MK_CUSTOM_COMPONENT}.cm-space::before {
    content: '·';
    color: var(--cm-space-color);
  }
`;

const OLD_SPECIAL_CHARS =
  window.CodeMirror.defaults.specialChars ??
  /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\u202d\u202e\u2066\u2067\u2069\ufeff\ufff9-\ufffc]/g;

const specialCharsShowClass = 'cm-special-chars-show';

export const specialCharsShow = () => {
  window.CodeMirror.defineOptionPlus('specialCharsShow', true, (editor) => {
    const styleEl = createStyle(specialCharsShowCSS);
    styleEl.classList.add(specialCharsShowClass);

    editor.setOption(
      'specialChars',
      /[ \u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\u202d\u202e\u2066\u2067\u2069\ufeff\ufff9-\ufffc]/
    );
    editor.setOption('specialCharPlaceholder', (ch) => {
      if (ch === ' ') {
        return createElement('span', 'cm-space');
      }

      let code = ch.charCodeAt(0);
      let char = ch;

      if (code === 10) char = '␤';
      else if (code >= 32) char = '•';
      else char = String.fromCharCode(9216 + code);

      const el = createElement('span', 'cm-invalidchar');
      el.textContent = char;
      el.setAttribute(
        'aria-label',
        `異常文字: \\u${ch.charCodeAt(0).toString(16)}`
      );
      return el;
    });

    const specialCharsHoverTokenClose = editor.registerTokenHover((token) => {
      if (!token.string.trim()) return null;

      const ch = token.string[0];
      const code = ch.charCodeAt(0);
      const label = Names[code];
      if (label) {
        return `${label} (U+${code
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')})`;
      }

      return null;
    });

    return () => {
      styleEl.remove();
      specialCharsHoverTokenClose();
      editor.setOption('specialChars', OLD_SPECIAL_CHARS);
    };
  });
};

declare module 'codemirror' {
  interface EditorConfiguration {
    specialCharsShow?: boolean;
  }
}
