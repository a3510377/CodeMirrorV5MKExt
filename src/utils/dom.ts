import { MK_CUSTOM_COMPONENT } from '@/constants';

export const parseClass = (
  ...classNames: (string | string[] | undefined)[]
): string[] => {
  return classNames.flatMap((className) =>
    Array.isArray(className) ? className : className?.trim().split(/\s+/) || []
  );
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...className: (string | string[])[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  element.classList.add(MK_CUSTOM_COMPONENT, ...parseClass(...className));
  return element;
};

export const waitForElement = <T extends Element = HTMLElement>(
  selector: string,
  timeoutMs = 10e3
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const query = (): T | null => document.querySelector(selector) as T | null;

    const el = query();
    if (el) {
      resolve(el);
      return;
    }

    let observer: MutationObserver | null = null;
    const timeoutId = setTimeout(() => {
      if (observer) observer.disconnect();
      reject(
        new Error(
          `waitForElement: '${selector}' not found within ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const el = query();
      if (el) {
        clearTimeout(timeoutId);
        observer?.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const createStyle = (
  code: string,
  node: Element = document.head
): HTMLStyleElement => {
  const css = createElement('style', 'mk-style');
  css.textContent = code;
  node.appendChild(css);

  return css;
};

export const createSvgFromString = (
  svgString: string,
  className?: string | string[]
): SVGSVGElement => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement as unknown as SVGSVGElement;

  svgElement.classList.add(
    ...parseClass(className),
    'mk-svg',
    MK_CUSTOM_COMPONENT
  );

  return svgElement;
};
