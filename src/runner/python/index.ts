import {
  type AppendOutputHandler,
  type PyodideWokePoolResultError,
  WorkerPool,
} from './workers/worker-pool';

export const createPyodideWorkerPool = (
  numWorkers: number,
  appendOutput: AppendOutputHandler
) => {
  const pool = new WorkerPool(numWorkers, appendOutput);

  return async (code: string) => {
    try {
      await pool.run(code);
    } catch (err) {
      if (typeof err === 'object') {
        const errObj = err as PyodideWokePoolResultError;
        if (errObj.type === 'end') {
          appendOutput(errObj.error + '\n', 'err');
          return;
        }

        const errorMessage =
          typeof errObj.error === 'object'
            ? errObj.error.message
            : errObj.error;
        const errorCode =
          typeof errObj.error === 'object' ? errObj.error.code : errObj.error;

        if (errorCode === 'EXEC_TIMEOUT') {
          appendOutput(
            'Error: TimeoutError - 程式執行時間過長，請嘗試簡化程式\n',
            'err'
          );
          return;
        } else if (errorCode === 'CODE_EMPTY') {
          appendOutput('Error - CODE_EMPTY\n', 'err');
          return;
        } else if (errorCode === 'SETUP_CODE_ERROR') {
          appendOutput(`內部錯誤: ${errorMessage}\n`, 'err');
          return;
        }
      }
      console.log(typeof err, err);

      // if ('err' in err) {
      //   if (err.err === 'EXEC_TIMEOUT') {
      //     appendOutput(
      //       'Error: TimeoutError - 程式執行時間過長，請嘗試簡化程式\n',
      //       'err'
      //     );
      //     return;
      //   } else if (err.err === 'CODE_EMPTY') {
      //     appendOutput('Error - CODE_EMPTY\n', 'err');
      //     return;
      //   } else if (err.err === 'SETUP_CODE_ERROR') {
      //     appendOutput('Error - SETUP_CODE_ERROR\n', 'err');
      //     return;
      //   }
      // }

      appendOutput('Error: ' + err + '\n', 'err');
    } finally {
      appendOutput('\n───────────────────────────────\n', 'log');
    }
  };
};

export const createDefaultOutputHandler = (
  outputEl: Element,
  options: {
    MAX_LINES?: number;
    forceDown?: boolean;
    maxExecutionTime?: number;
  } = {}
) => {
  const MAX_LINES = options.MAX_LINES || 500;
  let currentLine: Element | null = null;

  return ((text, type = 'log') => {
    const isError = type === 'err';
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!currentLine) {
        currentLine = document.createElement('div');
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

      lastSpan.textContent += line;

      // if not the last line, reset currentLine to null to create a new line
      if (index < lines.length - 1) currentLine = null;
    });

    if (options.forceDown === undefined || options.forceDown) {
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }) satisfies AppendOutputHandler;
};
