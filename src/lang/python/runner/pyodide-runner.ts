import { loadPyodide } from 'pyodide';

const postMessage = self.postMessage.bind(self) as (
  msg: PyodideRunnerMessageEventResult
) => void;

let pyodideReadyPromise = (async () => {
  const pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/',
  });

  postMessage({ type: 'ready' });

  return pyodide;
})();

self.onmessage = async (event: MessageEvent<PyodideRunnerMessageEventData>) => {
  const pyodide = await pyodideReadyPromise;
  const { code, options } = event.data;

  if (!code) {
    postMessage({ type: 'error', error: 'CODE_EMPTY' });
    return;
  }

  let bufOut: number[] = [];
  let bufErr: number[] = [];

  let lastFlushTime = 0;

  // If the interval is 0, the main thread will be blocked
  // -> while True: print("test")
  const FLUSH_INTERVAL = 4; // ms
  const MAX_BATCH = 50; // max number of chars to send in one batch

  const flushBatch = (
    buf: number[],
    type: 'stdout' | 'stderr',
    size?: number
  ) => {
    if (buf.length) {
      const batch = buf.splice(0, size ?? MAX_BATCH);
      postMessage({ type, data: batch });
    }
  };

  let timeoutFlush: ReturnType<typeof setTimeout> | null = null;
  const scheduleFlush = () => {
    if (timeoutFlush) return;
    timeoutFlush = setTimeout(() => {
      flushBatch(bufOut, 'stdout', bufOut.length);
      flushBatch(bufErr, 'stderr', bufErr.length);

      timeoutFlush = null;
      lastFlushTime = performance.now();

      if (bufOut.length || bufErr.length) {
        scheduleFlush();
      }
    }, FLUSH_INTERVAL);
  };

  const push = (buf: number[], t: number) => {
    buf.push(t);

    const now = performance.now();
    if (now - lastFlushTime >= FLUSH_INTERVAL) {
      bufOut.length && flushBatch(bufOut, 'stdout', bufOut.length);
      bufErr.length && flushBatch(bufErr, 'stderr', bufErr.length);
      lastFlushTime = now;
    }

    if (!timeoutFlush && (bufOut.length || bufErr.length)) {
      scheduleFlush();
    }
  };

  pyodide.setStdout({ raw: (t) => push(bufOut, t) });
  pyodide.setStderr({ raw: (t) => push(bufErr, t) });

  const dict = pyodide.globals.get('dict');
  const globals = dict(Object.entries(options?.context || {}));

  const forceFlush = () => {
    flushBatch(bufOut, 'stdout', bufOut.length);
    flushBatch(bufErr, 'stderr', bufErr.length);
  };

  try {
    // disable js, pyodide... modules
    await pyodide.runPythonAsync(
      'import builtins,sys,types;[n for n in list(sys.modules) if any(n==m or n.startswith(m+".")for m in["js","pyodide","pyodide_js","micropip","_pyodide"]) and sys.modules.pop(n)];_d=types.SimpleNamespace(__getattr__=lambda s,k:(_ for _ in()).throw(RuntimeError(f"Access to {k} module is blocked")));[sys.modules.__setitem__(n,_d) for n in["js","pyodide","pyodide_js","micropip","_pyodide"]];builtins.__import__=(lambda _i:lambda n,*a,**kw:(_ for _ in()).throw(ImportError(f"Import of {n!r} is disabled"))if any(n==m or n.startswith(m+".")for m in["js","pyodide","pyodide_js","micropip","_pyodide"])else _i(n,*a,**kw))(builtins.__import__);del builtins,sys,types,_d'
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
      type: 'error',
      error: { code: 'SETUP_CODE_ERROR', message: err.toString() },
    });
    return;
  }

  let index = 0;
  pyodide.setStdin({ stdin: () => options?.inputs?.at(index++) });

  try {
    const result = await pyodide.runPythonAsync(code, { globals });

    index = 0;
    forceFlush();
    postMessage({
      type: 'end',
      result: { type: 'success', result },
    });
  } catch (err: any) {
    index = 0;
    forceFlush();
    postMessage({
      type: 'end',
      result: { type: 'error', error: err.toString() },
    });
  }
};

export type PyodideRunnerWorkerID = string;

export type PyodideRunnerMessageEventData = {
  code: string;
  options?: {
    inputs?: string[];
    context?: Record<string, any>;
    setupCode: { code: string; options: {} }[];
  };
};

export type PyodideRunnerErrorCodes = 'CODE_EMPTY' | 'SETUP_CODE_ERROR';

export type PyodideRunnerMessageEventResult =
  | { type: 'ready' }
  | {
      type: 'end';
      result:
        | { type: 'success'; result: any }
        | { type: 'error'; error: string };
    }
  | {
      type: 'error';
      error:
        | PyodideRunnerErrorCodes
        | { code: PyodideRunnerErrorCodes; message: string };
    }
  | { type: 'stdout'; data: number[] }
  | { type: 'stderr'; data: number[] };
