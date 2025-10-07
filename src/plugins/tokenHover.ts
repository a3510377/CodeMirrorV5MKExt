import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createElement, createStyle } from '@/utils/dom';

interface TokenHoverHandler {
  getInfo: (
    token: CodeMirror.Token,
    editor: CodeMirror.Editor
  ) => string | null;
}

export const hoverTooltipClass = 'cm-hover-tooltip';

export const setupTokenHover = (editor: CodeMirror.Editor, delay = 200) => {
  const wrapper = editor.getWrapperElement();
  const handlers = new Set<TokenHoverHandler>();

  let tooltip: HTMLDivElement | null = null;
  let lastToken: CodeMirror.Token | null = null;
  let timer: number | undefined;

  const styleEl = createStyle(`$css
    .${MK_CUSTOM_COMPONENT}.${hoverTooltipClass} {
      position: absolute;
      z-index: 9999;
      background: rgba(40, 40, 40, 0.9);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      white-space: pre;
      transition: opacity 0.1s ease;
      opacity: 0;
    }
  `);

  const hideTooltip = () => {
    tooltip?.remove();
    tooltip = null;
  };

  const showTooltip = (e: MouseEvent, text: string) => {
    if (!tooltip) {
      tooltip = createElement('div', 'cm-hover-tooltip');
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = text;

    const offset = 12;
    const rect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = e.pageX + offset - rect.width / 2;
    let y = e.pageY + offset;

    if (x < 8) x = 8;
    if (x + rect.width > vw - 8) x = vw - rect.width - 8;

    if (y + rect.height > vh - 8) y = e.pageY - rect.height - offset;
    if (y < 8) y = 8;

    tooltip.style.top = `${y}px`;
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = '1';
  };

  const onMouseMove = (e: MouseEvent) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const pos = editor.coordsChar({ left: e.clientX, top: e.clientY });
      const token = editor.getTokenAt(pos, true);

      if (!token || !token.string.trim()) {
        hideTooltip();
        lastToken = null;
        return;
      }

      if (
        lastToken &&
        lastToken.start === token.start &&
        lastToken.end === token.end
      ) {
        return;
      }
      lastToken = token;

      let info: string | null = null;
      for (const h of handlers) {
        const result = h.getInfo(token, editor);
        if (result) {
          info = result;
          break;
        }
      }

      if (info) showTooltip(e, info);
      else hideTooltip();
    }, delay);
  };

  const onMouseLeave = () => {
    clearTimeout(timer);
    hideTooltip();
    lastToken = null;
  };

  wrapper.addEventListener('mousemove', onMouseMove, { passive: true });
  wrapper.addEventListener('mouseleave', onMouseLeave, { passive: true });

  return {
    handlers,
    dispose: () => {
      handlers.clear();
      hideTooltip();
      clearTimeout(timer);
      styleEl.remove();
      wrapper.removeEventListener('mousemove', onMouseMove);
      wrapper.removeEventListener('mouseleave', onMouseLeave);
    },
  };
};

window.CodeMirror.defineInitHook(function (editor) {
  const state: CodeMirror.EditorState = editor.state;

  state.tokenHover?.dispose();
  state.tokenHover = setupTokenHover(editor);
});

window.CodeMirror.defineExtension(
  'registerTokenHover',
  function (
    this: CodeMirror.Editor,
    getInfo: (
      token: CodeMirror.Token,
      editor: CodeMirror.Editor
    ) => string | null
  ) {
    const entry = (this.state as CodeMirror.EditorState).tokenHover;
    if (!entry) {
      throw new Error(
        'Token hover system is not set up. Call setupTokenHover() first.'
      );
    }

    const handler: TokenHoverHandler = { getInfo };
    entry.handlers.add(handler);

    return () => {
      entry.handlers.delete(handler);
      if (entry.handlers.size === 0) {
        entry.dispose();
      }
    };
  }
);

window.CodeMirror.defineExtension(
  'unregisterTokenHover',
  function (this: CodeMirror.Editor, dispose: () => void) {
    dispose();
  }
);

declare module 'codemirror' {
  interface EditorState {
    tokenHover?: {
      dispose: () => void;
      handlers: Set<TokenHoverHandler>;
    };
  }

  interface Editor {
    registerTokenHover: (
      getInfo: (
        token: CodeMirror.Token,
        editor: CodeMirror.Editor
      ) => string | null
    ) => () => void;
    unregisterTokenHover: (dispose: () => void) => void;
  }
}
