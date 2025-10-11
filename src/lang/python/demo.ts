import { createDefaultOutputHandler, WorkerPool } from './runner';

import { createEditor } from '@';

// Maximum number of output lines to keep
const MAX_LINES = 500;
// Maximum number of workers to run code (to limit resource usage)
const MAX_WORKERS = 2;
// Maximum execution time for each code run (in ms)
const EXECUTION_TIMEOUT = 10_000; // ms

const ERROR_MESSAGES = {
  EXEC_TIMEOUT: '程式執行時間過長，已被強制終止',
  SETUP_CODE_ERROR: '內部設定程式碼錯誤，請聯繫管理員',
  CODE_EMPTY: '程式碼為空',
};

addEventListener('DOMContentLoaded', async () => {
  const output = document.querySelector('#output')!;
  const runBtn = document.querySelector('#run-btn')! as HTMLButtonElement;

  const { editor } = await createEditor({
    mode: 'python',
    value:
      'print("Hello Pyodide!")\n\nraise Exception("測試錯誤")\n\nwhile True:\n    print("test")\n',
    parent: document.querySelector('#editor') as HTMLElement,
    textareaID: 'code-editor-textarea',
  });

  const appendOutput = createDefaultOutputHandler(output, { MAX_LINES });
  const pool = new WorkerPool(MAX_WORKERS, appendOutput, EXECUTION_TIMEOUT);

  pool.onStateChange = (available) => (runBtn.disabled = !available);

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;

    try {
      await pool.run(editor.getValue());
    } catch (err: any) {
      console.error('Error occurred while running code:', err);

      // Python Error
      if (err.type === 'end') {
        appendOutput(`${err.error}`, 'err');
      } else {
        const code = err?.error;

        let desc = '';
        if (typeof code === 'string' && code in ERROR_MESSAGES) {
          desc = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
        } else {
          desc = err?.error?.message || err?.toString() || '未知錯誤';
        }

        appendOutput(`\n錯誤: ${desc}`, 'err');
      }
    }

    appendOutput('', 'divider');
    runBtn.disabled = false;
  });
});
