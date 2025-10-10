import { loadPyodide } from 'pyodide';

let pyodideReadyPromise = (async () => {
  const pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/',
  });

  return pyodide;
})();

const postMessage = self.postMessage.bind(self) as (
  msg: PyodideRunnerMessageEventResult
) => void;

self.onmessage = async (event: MessageEvent<PyodideRunnerMessageEventData>) => {
  const pyodide = await pyodideReadyPromise;
  const { id, code, options } = event.data;

  if (!code) {
    postMessage({ id, type: 'error', error: 'CODE_EMPTY' });
    return;
  }

  let bufOut: number[] = [];
  let bufErr: number[] = [];

  let lastFlushTime = 0;
  const FLUSH_INTERVAL = 4;
  const MAX_BATCH = 50;

  const flushBatch = (buf: number[], type: 'stdout' | 'stderr') => {
    if (buf.length) {
      const batch = buf.splice(0, MAX_BATCH);
      postMessage({ id, type, data: batch });
    }
    return buf;
  };

  const push = (buf: number[], t: number) => {
    buf.push(t);

    const now = performance.now();
    if (now - lastFlushTime >= FLUSH_INTERVAL) {
      if (bufOut.length) flushBatch(bufOut, 'stdout');
      if (bufErr.length) flushBatch(bufErr, 'stderr');
      lastFlushTime = now;
    }
  };

  pyodide.setStdout({ raw: (t) => push(bufOut, t) });
  pyodide.setStderr({ raw: (t) => push(bufErr, t) });

  const dict = pyodide.globals.get('dict');
  const globals = dict(Object.entries(options?.context || {}));

  const forceFlush = () => {
    flushBatch(bufOut, 'stdout');
    flushBatch(bufErr, 'stderr');
  };

  try {
    // disable js, pyodide... modules
    await pyodide.runPythonAsync(
      'import builtins,sys,types;[n for n in list(sys.modules) if any(n==m or n.startswith(m+".")for m in["js","pyodide","pyodide_js","micropip"]) and sys.modules.pop(n)];_d=types.SimpleNamespace(__getattr__=lambda s,k:(_ for _ in()).throw(RuntimeError(f"Access to {k} module is blocked")));[sys.modules.__setitem__(n,_d) for n in["js","pyodide","pyodide_js","micropip"]];builtins.__import__=(lambda _i:lambda n,*a,**kw:(_ for _ in()).throw(ImportError(f"Import of {n!r} is disabled"))if any(n==m or n.startswith(m+".")for m in["js","pyodide","pyodide_js","micropip"])else _i(n,*a,**kw))(builtins.__import__);del builtins,sys,types,_d'
    );
    // show traceback except those from pyodide internal
    await pyodide.runPythonAsync(
      '__import__("sys").excepthook=lambda a,b,c:print(("".join(__import__("traceback").format_list([d for d in __import__("traceback").extract_tb(c)if not d.filename.startswith(("/lib/python", "<frozen"))])).lstrip()+"".join(__import__("traceback").format_exception_only(a,b))).strip("\\n"), file=__import__("sys").stderr)'
    );
    // force flush after each print
    await pyodide.runPythonAsync(
      '__import__("sys").stdout=type("",(),{"__init__":lambda s,a:setattr(s,"a",a),"write":lambda s,x:(s.a.write(x),s.a.flush()),"flush":lambda s:s.a.flush()})(__import__("sys").__stdout__);__import__("sys").stderr=type("",(),{"__init__":lambda s,a:setattr(s,"a",a),"write":lambda s,x:(s.a.write(x),s.a.flush()),"flush":lambda s:s.a.flush()})(__import__("sys").__stderr__)'
    );

    // setup code
    for (const item of options?.setupCode || []) {
      await pyodide.runPythonAsync(item.code, { globals }).catch((err) => {
        throw new Error(`Setup code error: ${err}`);
      });
    }
  } catch (err: any) {
    postMessage({
      id,
      type: 'error',
      error: { code: 'SETUP_CODE_ERROR', message: err.toString() },
    });
    return;
  }

  try {
    const result = await pyodide.runPythonAsync(code, { globals });

    forceFlush();
    postMessage({
      id,
      type: 'end',
      result: { type: 'success', result },
    });
  } catch (err: any) {
    forceFlush();
    postMessage({
      id,
      type: 'end',
      result: { type: 'error', error: err.toString() },
    });
  }
};

export type PyodideRunnerWorkerID = string;

export type PyodideRunnerMessageEventData = {
  id: PyodideRunnerWorkerID;
  code: string;
  options?: {
    inputs?: string[];
    context?: Record<string, any>;
    setupCode: { code: string; options: {} }[];
  };
};

export type PyodideRunnerErrorCodes = 'CODE_EMPTY' | 'SETUP_CODE_ERROR';

export type PyodideRunnerMessageEventResult =
  | {
      id: PyodideRunnerWorkerID;
      type: 'end';
      result:
        | { type: 'success'; result: any }
        | { type: 'error'; error: string };
    }
  | {
      id: PyodideRunnerWorkerID;
      type: 'error';
      error:
        | PyodideRunnerErrorCodes
        | { code: PyodideRunnerErrorCodes; message: string };
    }
  | { id: PyodideRunnerWorkerID; type: 'stdout'; data: number[] }
  | { id: PyodideRunnerWorkerID; type: 'stderr'; data: number[] };
