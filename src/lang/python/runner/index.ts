import type {
  PyodideRunnerMessageEventData,
  PyodideRunnerMessageEventResult,
} from './pyodide-runner';
import PyodideWorker from './pyodide-runner.ts?worker';

export const createDefaultOutputHandler = (
  outputEl: Element,
  options: { MAX_LINES?: number; forceDown?: boolean } = {}
) => {
  const MAX_LINES = options.MAX_LINES || 500;
  let currentLine: HTMLDivElement | null = null;
  let lineIndex = 1;

  const tryScrollToBottom = () => {
    if (options.forceDown !== false) {
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  };

  return ((text, type = 'log') => {
    const isError = type === 'err';

    if (type === 'divider') {
      outputEl.appendChild(document.createElement('hr'));
      if (text) {
        const span = document.createElement('span');
        span.textContent = text;
        outputEl.appendChild(span);
      }
      currentLine = null;
      lineIndex = 1;

      tryScrollToBottom();
      return;
    }

    const lines = text?.split(/\r?\n/);

    lines?.forEach((line, index) => {
      if (!currentLine) {
        currentLine = document.createElement('div');
        currentLine.dataset.line = String(lineIndex++);
        outputEl.appendChild(currentLine);

        // clear old lines
        while (outputEl.children.length > MAX_LINES) {
          outputEl.firstChild && outputEl.removeChild(outputEl.firstChild);
        }
      }

      let lastSpan = currentLine.lastChild as HTMLElement | null;
      // create new span if type changed or no span yet
      if (
        !lastSpan ||
        (isError && lastSpan.dataset.type !== 'err') ||
        (!isError && lastSpan.dataset.type !== 'log')
      ) {
        lastSpan = document.createElement('span');
        lastSpan.dataset.type = type;
        currentLine.appendChild(lastSpan);
      }

      // || '\u00A0';
      lastSpan.textContent += line;

      if (index < lines.length - 1) currentLine = null;
    });

    tryScrollToBottom();
  }) satisfies AppendOutputHandler;
};

class WorkerWrapper {
  busy = false;
  isReady = false;
  ready!: Promise<void>;
  worker!: Worker;

  private _emitStateChange: () => void;

  constructor(emitStateChange: () => void) {
    this._emitStateChange = emitStateChange;
    this.reset();
  }

  reset() {
    if (this.worker) this.worker.terminate();

    this.worker = new PyodideWorker();
    this.busy = false;
    this.isReady = false;

    const handler = (e: MessageEvent<PyodideRunnerMessageEventResult>) => {
      if (e.data.type === 'ready') {
        this.worker.removeEventListener('message', handler);
        this.isReady = true;
        this._emitStateChange();
      }
    };

    this.worker.addEventListener('message', handler);
  }
}

interface Task extends PyodideRunnerMessageEventData {
  resolve: (res: PyodideWorkerResultSuccess) => void;
  reject: (err: PyodideWorkerResultError) => void;
}

export class WorkerPool {
  private _pool: WorkerWrapper[] = [];
  private _queue: Task[] = [];
  private _appendOutput: AppendOutputHandler;
  private _maxExecutionTime: number;

  onStateChange?: (
    available: boolean,
    busyCount: number,
    readyCount: number,
    total: number
  ) => void;

  constructor(
    size: number,
    appendOutput: AppendOutputHandler,
    maxExecutionTime = 5000
  ) {
    this._appendOutput = appendOutput;
    this._maxExecutionTime = maxExecutionTime;

    this._pool = Array.from(
      { length: size },
      () => new WorkerWrapper(() => this._emitStateChange())
    );
  }

  private _emitStateChange() {
    this.onStateChange?.(
      this._pool.some((w) => !w.busy && w.isReady),
      this._pool.filter((w) => w.busy).length,
      this._pool.filter((w) => w.isReady).length,
      this._pool.length
    );
  }

  private _decodeOutput(output: string | number | number[]): string {
    if (Array.isArray(output)) return String.fromCharCode(...output);
    if (typeof output === 'number') return String.fromCharCode(output);
    return output;
  }

  async run(
    code: string,
    options?: PyodideRunnerMessageEventData['options']
  ): Promise<PyodideWorkerResultSuccess> {
    return new Promise((resolve, reject) => {
      const task: Task = { code, options, resolve, reject };
      this._queue.push(task);
      this._processQueue();
    });
  }

  private async _processQueue() {
    for (const wrapper of this._pool) {
      if (wrapper.busy || !wrapper.isReady) continue;
      const task = this._queue.shift();
      if (!task) break;

      wrapper.busy = true;
      this._emitStateChange();

      const { worker } = wrapper;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        worker.removeEventListener('message', handler);
        wrapper.busy = false;
        this._emitStateChange();
      };

      const resetWorker = () => {
        wrapper.reset();
        this._emitStateChange();
      };

      const handler = (e: MessageEvent<PyodideRunnerMessageEventResult>) => {
        const data = e.data;
        switch (data.type) {
          case 'stdout':
          case 'stderr':
            this._appendOutput(
              this._decodeOutput(data.data),
              data.type === 'stdout' ? 'log' : 'err'
            );
            break;
          case 'end':
            cleanup();
            const { result } = data;
            if (result.type === 'success') task.resolve(result);
            else task.reject({ ...result, type: 'end' });
            this._processQueue();
            break;
          case 'error':
            cleanup();
            task.reject({ type: 'error', error: data.error });
            resetWorker();
            this._processQueue();
            break;
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ code: task.code, options: task.options });

      if (this._maxExecutionTime > 0) {
        timeoutHandle = setTimeout(() => {
          cleanup();
          task.reject({ type: 'error', error: 'EXEC_TIMEOUT' });
          resetWorker();
          this._processQueue();
        }, this._maxExecutionTime);
      }
    }
  }

  resetAll() {
    for (const w of this._pool) {
      w.reset();
    }
    this._queue = [];
    this._emitStateChange();
  }
}

export type AppendOutputHandler = (
  text?: string,
  type?: 'log' | 'err' | 'divider'
) => void;

export interface PyodideWorkerResultSuccess {
  type: 'success';
  result: any;
}

export type PyodideWorkerResultError =
  | { type: 'end'; error: string }
  | {
      type: 'error';
      error:
        | 'EXEC_TIMEOUT'
        | Extract<PyodideRunnerMessageEventResult, { type: 'error' }>['error'];
    };
