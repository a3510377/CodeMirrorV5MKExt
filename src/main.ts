import { createEditor } from '.';

const testCode = `# Python test code
def fibonacci(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else​:
        return fibonacci(n - 1) + fibonacci(n - 2)
# a1
# a1
# a1
# a1
# a2
# a2
# a2
# a2
# a2
# 			
`;

addEventListener('DOMContentLoaded', async () => {
  await createEditor({
    mode: 'python',
    value: testCode,
    parent: document.querySelector('#app') as HTMLElement,
    textareaID: 'code-editor-textarea',
  });
});
