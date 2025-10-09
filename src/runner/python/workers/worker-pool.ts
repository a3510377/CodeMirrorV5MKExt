import type {
  PyodideRunnerMessageEventData,
  PyodideRunnerMessageEventResult,
} from './pyodide-runner';
import PyodideWorker from './pyodide-runner.ts?worker';

class WorkerWrapper {
  worker: Worker;
  busy: boolean = false;

  constructor() {
    this.worker = new PyodideWorker();
  }
}

export class WorkerPool {
  protected pool: WorkerWrapper[] = [];
  protected queue: Task[] = [];
  protected maxExecutionTime = 5000; // ms
  protected appendOutput: AppendOutputHandler;

  constructor(
    size: number,
    appendOutput: AppendOutputHandler,
    maxExecutionTime = 5000
  ) {
    for (let i = 0; i < size; i++) {
      this.pool.push(new WorkerWrapper());
    }

    this.appendOutput = appendOutput;
    this.maxExecutionTime = maxExecutionTime;
  }

  run(
    code: string,
    options?: PyodideRunnerMessageEventData['options']
  ): Promise<any> {
    const id = `${Date.now().toString(16)}-${Math.random()
      .toString(16)
      .slice(2)}`;

    return new Promise((resolve, reject) => {
      const task: Task = { id, code, options, resolve, reject };
      this.queue.push(task);
      this.processQueue();
    });
  }

  private processQueue() {
    for (const wrapper of this.pool) {
      if (wrapper.busy) continue;
      const task = this.queue.shift();

      if (!task) break;

      wrapper.busy = true;

      const timeoutHandle = setTimeout(() => {
        wrapper.worker.terminate();
        wrapper.worker = new PyodideWorker();
        wrapper.busy = false;

        task.reject({
          type: 'error',
          error: 'EXEC_TIMEOUT',
        });
        this.processQueue();
      }, this.maxExecutionTime);

      const handler = ({
        data,
      }: MessageEvent<PyodideRunnerMessageEventResult>) => {
        if (data.id !== task.id) return;

        const { type } = data;

        if (type === 'end' || type === 'error') {
          clearTimeout(timeoutHandle);
          wrapper.worker.removeEventListener('message', handler);
          wrapper.busy = false;

          if (type === 'end') {
            const result = data.result;

            if (result.type === 'success') {
              task.resolve(result);
            } else {
              task.reject({ ...result, type: 'end' });
            }
          } else {
            task.reject({ type: 'error', error: data.error });
          }

          this.processQueue();
        } else if (type === 'stdout' || type === 'stderr') {
          let str: string;

          const { data: output } = data;
          if (Array.isArray(output)) {
            str = output.map((c: number) => String.fromCharCode(c)).join('');
          } else if (typeof output === 'number') {
            str = String.fromCharCode(output);
          } else {
            str = output;
          }

          this.appendOutput(str, type === 'stdout' ? 'log' : 'err');
        }
      };

      wrapper.worker.addEventListener('message', handler);
      wrapper.worker.postMessage({
        id: task.id,
        code: task.code,
        options: task.options,
      } satisfies PyodideRunnerMessageEventData);
    }
  }
}

export interface Task extends PyodideRunnerMessageEventData {
  resolve: (res: PyodideWokePoolResultSuccess) => void;
  reject: (err: PyodideWokePoolResultError) => void;
}

export type AppendOutputHandler = (text: string, type: 'log' | 'err') => void;

export interface PyodideWokePoolResultSuccess {
  type: 'success';
  result: any;
}

export type PyodideWokePoolResultError =
  | { type: 'end'; error: string }
  | {
      type: 'error';
      error:
        | 'EXEC_TIMEOUT'
        | Extract<PyodideRunnerMessageEventResult, { type: 'error' }>['error'];
    };
