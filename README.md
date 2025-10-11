# CodeMirror V5 MK Extensions

A powerful extension library for CodeMirror 5 that adds modern IDE-like features and enhancements to create a better code editing experience.

## Features

### 🎨 Enhanced Editor Experience
- **Dracula Theme** - Beautiful dark theme by default
- **Line Numbers** - Clear line numbering with enhanced styling
- **Active Line Highlighting** - Visual feedback for the current line
- **Selection Highlighting** - Highlights all occurrences of selected text
- **Bracket Matching** - Automatic bracket pair highlighting
- **Auto Close Brackets** - Smart bracket completion

### 🔧 Advanced Editing Capabilities
- **Multiple Cursors** - Edit multiple locations simultaneously
  - `Ctrl-D`: Select next occurrence
  - `Shift-Ctrl-L`: Select all occurrences
  - `Ctrl-Alt-Up/Down`: Add cursors above/below
- **Line Manipulation**
  - `Alt-Up/Down`: Move lines up or down
  - Triple-click line to select entire line
- **Smart Indentation**
  - Automatic indentation for Python and other languages
  - Indent guides visualization
  - `Tab`: Smart tab handling
  - `Shift-Tab`: Outdent

### 💡 Code Intelligence
- **Auto-completion** - Context-aware code completion (`Ctrl-Space`)
- **Code Folding** - Collapse and expand code blocks
- **Token Hover** - Enhanced hover information for code tokens
- **Special Characters Display** - Visualization of whitespace and special characters

### 🐍 Python Support
- **Pyodide Integration** - Run Python code directly in the browser
- **Python REPL** - Interactive Python execution
- **Custom Python indent unit** - Proper 4-space indentation for Python

### 🎯 Navigation & Utilities
- **Jump to Line** - Quickly navigate to specific lines (`Ctrl-G`)
- **Comment Toggle** - Quick comment/uncomment (`Ctrl-/`)
- **Status Bar** - Display cursor position and editor status
- **Search & Replace** - Built-in search functionality

## Installation

### Using npm/yarn

```bash
npm install codemirror-v6-demo
# or
yarn add codemirror-v6-demo
```

### Using CDN

Include the built files from your CDN or local build:

```html
<link rel="stylesheet" href="path/to/dist/main/MKCodeMirror5.css">
<script src="path/to/dist/main/MKCodeMirror5.iife.js"></script>
```

## Usage

### Basic Setup

```typescript
import { createEditor } from 'codemirror-v6-demo';

// Create an editor instance
const { editor, libController } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'javascript',
  value: 'console.log("Hello, World!");',
});
```

### Configuration Options

```typescript
interface CreateEditorOptions {
  // CodeMirror configuration options
  mode?: string;           // Language mode (e.g., 'javascript', 'python')
  value?: string;          // Initial editor content
  theme?: string;          // Editor theme (default: 'dracula')
  lineNumbers?: boolean;   // Show line numbers (default: true)
  
  // Custom options
  indentSize?: number;     // Custom indent size
  parent?: HTMLElement;    // Parent element to append editor
  container?: HTMLElement; // Custom container element
  textareaID?: string;     // Custom textarea ID
  
  // ... and all other CodeMirror.EditorConfiguration options
}
```

### Example: Python Editor with Pyodide

```typescript
import { createEditor } from 'codemirror-v6-demo';
import { WorkerPool } from 'codemirror-v6-demo/runner/python';

// Create Python editor
const { editor } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'python',
  value: 'print("Hello from Python!")',
});

// Setup Python execution
const outputEl = document.getElementById('output');
const appendOutput = createDefaultOutputHandler(outputEl);
const workerPool = new WorkerPool(1, appendOutput);

// Run Python code
document.getElementById('run-btn').addEventListener('click', async () => {
  const code = editor.getValue();
  await workerPool.execute(code);
});
```

## Development

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- Yarn package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/a3510377/CodeMirrorV5MKExt.git
cd CodeMirrorV5MKExt

# Install dependencies
yarn install
```

### Development Commands

```bash
# Start development server
yarn dev

# Build all distributions
yarn build

# Build specific targets
yarn build:main    # Build main library
yarn build:worker  # Build worker files
yarn build:demo    # Build demo application

# Preview production build
yarn preview

# Lint code
yarn lint

# Lint and auto-fix
yarn lint:fix
```

### Project Structure

```
CodeMirrorV5MKExt/
├── src/
│   ├── extensions/      # Editor extensions
│   │   ├── clickLineSelect.ts
│   │   ├── indentGuide.ts
│   │   ├── mkCommands/  # Custom commands
│   │   ├── specialCharsShow.ts
│   │   └── statusbar.ts
│   ├── plugins/         # Editor plugins
│   ├── runner/          # Code execution (Python/Pyodide)
│   ├── utils/           # Utility functions
│   └── index.ts         # Main entry point
├── dist/                # Build output
│   ├── main/           # Main library build
│   ├── worker/         # Worker builds
│   └── demo/           # Demo application
├── index.html           # Demo page
└── vite.*.config.ts    # Build configurations
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl-Space` | Trigger autocomplete |
| `Ctrl-/` | Toggle comment |
| `Tab` | Smart tab/indent |
| `Shift-Tab` | Outdent |
| `Enter` | Smart newline with indent |
| `Ctrl-D` | Select next occurrence |
| `Shift-Ctrl-L` | Select all occurrences |
| `Ctrl-Alt-Up` | Add cursor above |
| `Ctrl-Alt-Down` | Add cursor below |
| `Alt-Up` | Move line up |
| `Alt-Down` | Move line down |
| `Ctrl-G` | Jump to line |

## Browser Support

This library supports all modern browsers that support:
- ES6+ JavaScript features
- Web Workers
- CodeMirror 5

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Please refer to the LICENSE file in the repository for license information.

## Acknowledgments

- Built on top of [CodeMirror 5](https://codemirror.net/5/)
- Python execution powered by [Pyodide](https://pyodide.org/)
- Uses [Vite](https://vitejs.dev/) for building and development

## Related Links

- [CodeMirror 5 Documentation](https://codemirror.net/5/doc/manual.html)
- [Pyodide Documentation](https://pyodide.org/en/stable/)
