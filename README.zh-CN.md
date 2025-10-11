# CodeMirror V5 MK 扩展

一个强大的 CodeMirror 5 扩展库，添加了现代 IDE 级别的功能和增强特性，以创造更好的代码编辑体验。

[English](./README.md) | 简体中文

## 功能特性

### 🎨 增强的编辑器体验
- **Dracula 主题** - 默认使用精美的深色主题
- **行号** - 清晰的行号显示，带有增强样式
- **活动行高亮** - 当前行的视觉反馈
- **选中内容高亮** - 高亮显示所有选中文本的匹配项
- **括号匹配** - 自动括号对高亮
- **自动闭合括号** - 智能括号补全

### 🔧 高级编辑功能
- **多光标** - 同时编辑多个位置
  - `Ctrl-D`: 选择下一个匹配项
  - `Shift-Ctrl-L`: 选择所有匹配项
  - `Ctrl-Alt-Up/Down`: 在上方/下方添加光标
- **行操作**
  - `Alt-Up/Down`: 上下移动行
  - 三击选择整行
- **智能缩进**
  - Python 和其他语言的自动缩进
  - 缩进参考线可视化
  - `Tab`: 智能 Tab 处理
  - `Shift-Tab`: 减少缩进

### 💡 代码智能
- **自动补全** - 上下文感知的代码补全 (`Ctrl-Space`)
- **代码折叠** - 折叠和展开代码块
- **Token 悬停** - 增强的代码标记悬停信息
- **特殊字符显示** - 可视化空白字符和特殊字符

### 🐍 Python 支持
- **Pyodide 集成** - 直接在浏览器中运行 Python 代码
- **Python REPL** - 交互式 Python 执行
- **自定义 Python 缩进单位** - Python 正确的 4 空格缩进

### 🎯 导航和工具
- **跳转到行** - 快速导航到特定行 (`Ctrl-G`)
- **注释切换** - 快速注释/取消注释 (`Ctrl-/`)
- **状态栏** - 显示光标位置和编辑器状态
- **搜索和替换** - 内置搜索功能

## 安装

### 使用 npm/yarn

```bash
npm install codemirror-v6-demo
# 或
yarn add codemirror-v6-demo
```

### 使用 CDN

从您的 CDN 或本地构建引入文件：

```html
<link rel="stylesheet" href="path/to/dist/main/MKCodeMirror5.css">
<script src="path/to/dist/main/MKCodeMirror5.iife.js"></script>
```

## 使用方法

### 基本设置

```typescript
import { createEditor } from 'codemirror-v6-demo';

// 创建编辑器实例
const { editor, libController } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'javascript',
  value: 'console.log("Hello, World!");',
});
```

### 配置选项

```typescript
interface CreateEditorOptions {
  // CodeMirror 配置选项
  mode?: string;           // 语言模式（例如：'javascript', 'python'）
  value?: string;          // 初始编辑器内容
  theme?: string;          // 编辑器主题（默认：'dracula'）
  lineNumbers?: boolean;   // 显示行号（默认：true）
  
  // 自定义选项
  indentSize?: number;     // 自定义缩进大小
  parent?: HTMLElement;    // 要附加编辑器的父元素
  container?: HTMLElement; // 自定义容器元素
  textareaID?: string;     // 自定义 textarea ID
  
  // ... 以及所有其他 CodeMirror.EditorConfiguration 选项
}
```

### 示例：使用 Pyodide 的 Python 编辑器

```typescript
import { createEditor } from 'codemirror-v6-demo';
import { WorkerPool } from 'codemirror-v6-demo/runner/python';

// 创建 Python 编辑器
const { editor } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'python',
  value: 'print("Hello from Python!")',
});

// 设置 Python 执行
const outputEl = document.getElementById('output');
const appendOutput = createDefaultOutputHandler(outputEl);
const workerPool = new WorkerPool(1, appendOutput);

// 运行 Python 代码
document.getElementById('run-btn').addEventListener('click', async () => {
  const code = editor.getValue();
  await workerPool.execute(code);
});
```

## 开发

### 前置要求

- Node.js（版本见 `.nvmrc` 文件）
- Yarn 包管理器

### 设置

```bash
# 克隆仓库
git clone https://github.com/a3510377/CodeMirrorV5MKExt.git
cd CodeMirrorV5MKExt

# 安装依赖
yarn install
```

### 开发命令

```bash
# 启动开发服务器
yarn dev

# 构建所有发行版
yarn build

# 构建特定目标
yarn build:main    # 构建主库
yarn build:worker  # 构建 worker 文件
yarn build:demo    # 构建演示应用

# 预览生产构建
yarn preview

# 代码检查
yarn lint

# 代码检查并自动修复
yarn lint:fix
```

### 项目结构

```
CodeMirrorV5MKExt/
├── src/
│   ├── extensions/      # 编辑器扩展
│   │   ├── clickLineSelect.ts
│   │   ├── indentGuide.ts
│   │   ├── mkCommands/  # 自定义命令
│   │   ├── specialCharsShow.ts
│   │   └── statusbar.ts
│   ├── plugins/         # 编辑器插件
│   ├── runner/          # 代码执行（Python/Pyodide）
│   ├── utils/           # 工具函数
│   └── index.ts         # 主入口点
├── dist/                # 构建输出
│   ├── main/           # 主库构建
│   ├── worker/         # Worker 构建
│   └── demo/           # 演示应用
├── index.html           # 演示页面
└── vite.*.config.ts    # 构建配置
```

## 键盘快捷键

| 快捷键 | 操作 |
|----------|--------|
| `Ctrl-Space` | 触发自动补全 |
| `Ctrl-/` | 切换注释 |
| `Tab` | 智能 Tab/缩进 |
| `Shift-Tab` | 减少缩进 |
| `Enter` | 智能换行并缩进 |
| `Ctrl-D` | 选择下一个匹配项 |
| `Shift-Ctrl-L` | 选择所有匹配项 |
| `Ctrl-Alt-Up` | 在上方添加光标 |
| `Ctrl-Alt-Down` | 在下方添加光标 |
| `Alt-Up` | 上移行 |
| `Alt-Down` | 下移行 |
| `Ctrl-G` | 跳转到行 |

## 浏览器支持

此库支持所有支持以下特性的现代浏览器：
- ES6+ JavaScript 特性
- Web Workers
- CodeMirror 5

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

有关许可证信息，请参阅仓库中的 LICENSE 文件。

## 致谢

- 基于 [CodeMirror 5](https://codemirror.net/5/) 构建
- Python 执行由 [Pyodide](https://pyodide.org/) 驱动
- 使用 [Vite](https://vitejs.dev/) 进行构建和开发

## 相关链接

- [CodeMirror 5 文档](https://codemirror.net/5/doc/manual.html)
- [Pyodide 文档](https://pyodide.org/en/stable/)
