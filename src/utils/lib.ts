import { createElement } from './dom';

const CODE_MIRROR_VERSION = '5.65.20';

const withCssLibs: LibName[] = [
  'addon/dialog/dialog',
  'addon/display/fullscreen',
  'addon/fold/foldgutter',
  'addon/hint/show-hint',
  'addon/lint/lint',
  'addon/merge/merge',
  'addon/scroll/simplescrollbars',
  'addon/search/matchesonscrollbar',
  'addon/tern/tern',
];

export class MKLibController {
  private _libs: { [key: string]: string } = {};

  public static getLibElementID = (name: string, type: 'js' | 'css') =>
    `${name.replace(/[^a-z0-9]/gi, '-')}-lib-${type}`;

  async addLib(
    name: string,
    type?: 'js' | 'css',
    asyncLoad: boolean = false
  ): Promise<void> {
    if (!/^[\da-zA-Z\/]+$/.test(name)) return Promise.resolve();

    const promises: Promise<void>[] = [];

    if (type !== 'js' && withCssLibs.includes(name as LibName)) {
      this.addStyle(
        name,
        `https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODE_MIRROR_VERSION}/${name}.min.css`
      );
    }

    if (type !== 'css') {
      promises.push(
        this.addScript(
          name,
          `https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODE_MIRROR_VERSION}/${name}.min.js`,
          asyncLoad
        )
      );
    }

    await Promise.all(promises);
  }

  addScript(
    name: string,
    url: string,
    asyncLoad: boolean = true
  ): Promise<void> {
    const id = MKLibController.getLibElementID(name, 'js');
    this._libs[id] = url;

    if (document.getElementById(id)) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const script = createElement('script', 'mk-lib-script');
      script.id = id;
      script.src = url;
      script.async = asyncLoad;

      script.onload = () => resolve();
      script.onerror = (e) => reject(e);

      document.body.appendChild(script);
    });
  }

  addStyle(name: string, url: string) {
    const id = MKLibController.getLibElementID(name, 'css');
    this._libs[id] = url;

    if (document.getElementById(id)) return;

    const link = createElement('link', 'mk-lib-style');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  getLib(name: string, type: 'js' | 'css') {
    return this._libs[MKLibController.getLibElementID(name, type)];
  }

  removeLib(name: string, type: 'js' | 'css') {
    const id = MKLibController.getLibElementID(name, type);
    const el = document.getElementById(id);
    if (el) el.parentNode?.removeChild(el);
    delete this._libs[id];
  }

  getAllLibs() {
    return { ...this._libs };
  }
}

export type LibName =
  | 'addon/comment/comment'
  | 'addon/comment/continuecomment'
  | 'addon/dialog/dialog'
  | 'addon/display/autorefresh'
  | 'addon/display/fullscreen'
  | 'addon/display/panel'
  | 'addon/display/placeholder'
  | 'addon/display/rulers'
  | 'addon/edit/closebrackets'
  | 'addon/edit/closetag'
  | 'addon/edit/continuelist'
  | 'addon/edit/matchbrackets'
  | 'addon/edit/matchtags'
  | 'addon/edit/trailingspace'
  | 'addon/fold/brace-fold'
  | 'addon/fold/comment-fold'
  | 'addon/fold/foldcode'
  | 'addon/fold/foldgutter'
  | 'addon/fold/indent-fold'
  | 'addon/fold/markdown-fold'
  | 'addon/fold/xml-fold'
  | 'addon/hint/anyword-hint'
  | 'addon/hint/css-hint'
  | 'addon/hint/html-hint'
  | 'addon/hint/javascript-hint'
  | 'addon/hint/show-hint'
  | 'addon/hint/sql-hint'
  | 'addon/hint/xml-hint'
  | 'addon/lint/coffeescript-lint'
  | 'addon/lint/css-lint'
  | 'addon/lint/html-lint'
  | 'addon/lint/javascript-lint'
  | 'addon/lint/json-lint'
  | 'addon/lint/lint'
  | 'addon/lint/yaml-lint'
  | 'addon/merge/merge'
  | 'addon/mode/loadmode'
  | 'addon/mode/multiplex'
  | 'addon/mode/multiplex_test'
  | 'addon/mode/overlay'
  | 'addon/mode/simple'
  | 'addon/scroll/annotatescrollbar'
  | 'addon/scroll/scrollpastend'
  | 'addon/scroll/simplescrollbars'
  | 'addon/search/jump-to-line'
  | 'addon/search/match-highlighter'
  | 'addon/search/matchesonscrollbar'
  | 'addon/search/search'
  | 'addon/search/searchcursor'
  | 'addon/selection/active-line'
  | 'addon/selection/mark-selection'
  | 'addon/selection/selection-pointer'
  | 'addon/tern/tern'
  | 'addon/tern/worker'
  | 'addon/wrap/hardwrap'
  | 'mode/python/python';
