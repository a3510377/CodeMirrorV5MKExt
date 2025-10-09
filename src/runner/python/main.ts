import { createDefaultOutputHandler, createPyodideWorkerPool } from '.';
import { createEditor } from '@';

const testCode = `
import sys

class AutoFlushIO:
    def __init__(self, stream):
        self.stream = stream
    def write(self, s):
        self.stream.write(s)
        self.stream.flush()
    def flush(self):
        self.stream.flush()

sys.stderr = AutoFlushIO(sys.__stderr__)
raise Exception("test")
`;

const MAX_LINES = 500; // keep last 500 lines

addEventListener('DOMContentLoaded', async () => {
  const output = document.querySelector('#output')!;
  const runBtn = document.querySelector('#run-btn')!;

  const { editor } = await createEditor({
    mode: 'python',
    value: testCode,
    parent: document.querySelector('#editor') as HTMLElement,
    textareaID: 'code-editor-textarea',
  });

  const runner = createPyodideWorkerPool(
    // 2 workers for demo
    2,
    // create default output handler
    createDefaultOutputHandler(output, { MAX_LINES })
  );

  runBtn.addEventListener('click', async () => {
    await runner(editor.getValue());

    runBtn.removeAttribute('disabled');
  });
});

// import { createEditor } from '.';
// import type * as PyodideType from 'pyodide';

// const loadPyodide = (
//   window as unknown as { loadPyodide: typeof PyodideType.loadPyodide }
// ).loadPyodide;

// // const testCode1 = `# Python test code
// // def fibonacci(n):
// //     if n == 0:
// //         return 0
// //     elif n == 1:
// //         return 1
// //     else​:
// //         return fibonacci(n - 1) + fibonacci(n - 2)
// // # a1
// // # a1
// // # a1
// // # a1
// // # a2
// // # a2
// // # a2
// // # a2
// // # a2
// // #
// // `;

// const testCode2 = `
// import sys

// class AutoFlushIO:
//     def __init__(self, stream):
//         self.stream = stream

//     def write(self, s):
//         self.stream.write(s)
//         self.stream.flush()

//     def flush(self):
//         self.stream.flush()

// sys.stderr = AutoFlushIO(sys.__stderr__)

// raise Exception("test")
// `;

// const ERROR_MESSAGES = {
//   KeyboardInterrupt: 'KeyboardInterrupt: 程式執行被中斷',
//   MemoryError: 'MemoryError: 記憶體不足，請嘗試簡化程式',
//   RecursionError: 'RecursionError: 遞迴層級過深，請嘗試簡化程式',
//   TimeoutError: 'TimeoutError: 程式執行時間過長，請嘗試簡化程式',
//   EOFError: 'EOFError: 您的程式需要輸入，但目前沒有可用的輸入資料',
// };

// addEventListener('DOMContentLoaded', async () => {
//   const output = document.querySelector('#output');
//   const runBtn = document.querySelector('#run-btn');

//   let currentLine: HTMLElement | null = null;
//   const MAX_LINES = 500; // keep last 500 lines

//   const appendOutput = (text: string | number, type: 'log' | 'err' = 'log') => {
//     if (!output) return;

//     const isError = type === 'err';
//     let str = typeof text === 'number' ? String.fromCharCode(text) : text;
//     const lines = str.split(/\r?\n/);

//     lines.forEach((line, index) => {
//       // if (!line) return;
//       if (!currentLine) {
//         currentLine = document.createElement('div');
//         output.appendChild(currentLine);

//         // clear old lines
//         while (output.children.length > MAX_LINES) {
//           output.firstChild && output.removeChild(output.firstChild);
//         }
//       }

//       let lastSpan = currentLine.lastChild as HTMLElement | null;
//       if (
//         !lastSpan ||
//         (isError && lastSpan.dataset.type !== 'err') ||
//         (!isError && lastSpan.dataset.type !== 'log')
//       ) {
//         lastSpan = document.createElement('span');
//         lastSpan.dataset.type = type;
//         if (isError) lastSpan.style.color = '#e74c3c';
//         currentLine.appendChild(lastSpan);
//       }

//       lastSpan.textContent += line;

//       if (index < lines.length - 1) currentLine = null;
//     });

//     output.scrollTop = output.scrollHeight;
//   };

//   const { editor } = await createEditor({
//     mode: 'python',
//     value: testCode2,
//     parent: document.querySelector('#editor') as HTMLElement,
//     textareaID: 'code-editor-textarea',
//   });

//   const pyodide = await loadPyodide();
//   const pythonInputData = ['1', '2'] as string[];

//   pyodide.setStderr({ raw: (text: number) => appendOutput(text, 'err') });
//   pyodide.setStdout({ raw: (text: number) => appendOutput(text) });

//   const runInModule = async (code: string, input: string[]) => {
//     let inputIndex = 0;
//     pyodide.setStdin({
//       stdin: () => (inputIndex >= input.length ? null : input[inputIndex++]),
//     });
//     const ns = pyodide.globals.get('dict')();
//     await pyodide.runPythonAsync(code, { globals: ns });
//   };

//   runBtn?.addEventListener('click', async () => {
//     runBtn.setAttribute('disabled', 'true');

//     appendOutput('\n>>> Running...\n');
//     try {
//       // Redirect print to flush immediately
//       await pyodide.runPythonAsync(
//         '__import__("sys").stdout=type("",(),{"__init__":lambda s,a:setattr(s,"a",a),"write":lambda s,x:(s.a.write(x),s.a.flush()),"flush":lambda s:s.a.flush()})(__import__("sys").__stdout__);__import__("sys").stderr=type("",(),{"__init__":lambda s,a:setattr(s,"a",a),"write":lambda s,x:(s.a.write(x),s.a.flush()),"flush":lambda s:s.a.flush()})(__import__("sys").__stderr__)'
//       );

//       // pyodide.setStdin(new StdinHandler(pythonInputData));
//       // const ns = pyodide.globals.get('dict')();
//       // await pyodide.runPythonAsync(editor.getValue(), { globals: ns });
//       await runInModule(editor.getValue(), pythonInputData).catch();
//       await pyodide.runPythonAsync(editor.getValue());
//     } catch (err) {
//       console.log(
//         await pyodide.runPythonAsync(`
// import traceback
// tb_list = [
//   tb
//   for tb in traceback.extract_tb(e.__traceback__)
//   if not tb.filename.startswith(("/lib/python", "<frozen"))
// ]
// print("".join(traceback.format_list(tb_list) + traceback.format_exception_only(type(e), e)))

// `)
//       );
//       console.debug(
//         Object.getOwnPropertyNames(err),
//         Object.getOwnPropertyDescriptors(err)
//       );

//       if (!(err instanceof Error)) {
//         appendOutput(`Error: ${JSON.stringify(err)}\n`);
//       } else {
//         if ('type' in err) {
//           const type = (err as any).type;
//           if (typeof type === 'string' && type in ERROR_MESSAGES) {
//             appendOutput(
//               `${ERROR_MESSAGES[type as keyof typeof ERROR_MESSAGES]}\n`,
//               'err'
//             );
//           } else {
//             appendOutput(`${err.name}: ${err.message}\n`, 'err');
//           }
//         }
//       }
//     }
//     appendOutput('\n───────────────────────────────\n');
//     runBtn.removeAttribute('disabled');
//   });
// });
