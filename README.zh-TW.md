# CodeMirror V5 MK 擴充

一個強大的 CodeMirror 5 擴充函式庫，加入了現代 IDE 級別的功能和增強特性，以創造更好的程式碼編輯體驗。

[English](./README.md) | [简体中文](./README.zh-CN.md) | 繁體中文

## 功能特性

### 🎨 增強的編輯器體驗
- **Dracula 主題** - 預設使用精美的深色主題
- **行號** - 清晰的行號顯示，帶有增強樣式
- **活動行高亮** - 當前行的視覺回饋
- **選取內容高亮** - 高亮顯示所有選取文字的匹配項
- **括號匹配** - 自動括號對高亮
- **自動閉合括號** - 智慧括號補全

### 🔧 進階編輯功能
- **多游標** - 同時編輯多個位置
  - `Ctrl-D`: 選擇下一個匹配項
  - `Shift-Ctrl-L`: 選擇所有匹配項
  - `Ctrl-Alt-Up/Down`: 在上方/下方新增游標
- **行操作**
  - `Alt-Up/Down`: 上下移動行
  - 三擊選擇整行
- **智慧縮排**
  - Python 和其他語言的自動縮排
  - 縮排參考線視覺化
  - `Tab`: 智慧 Tab 處理
  - `Shift-Tab`: 減少縮排

### 💡 程式碼智慧
- **自動補全** - 上下文感知的程式碼補全 (`Ctrl-Space`)
- **程式碼摺疊** - 摺疊和展開程式碼區塊
- **Token 懸停** - 增強的程式碼標記懸停資訊
- **特殊字元顯示** - 視覺化空白字元和特殊字元

### 🐍 Python 支援
- **Pyodide 整合** - 直接在瀏覽器中執行 Python 程式碼
- **Python REPL** - 互動式 Python 執行
- **自訂 Python 縮排單位** - Python 正確的 4 空格縮排

### 🎯 導覽和工具
- **跳轉到行** - 快速導覽到特定行 (`Ctrl-G`)
- **註解切換** - 快速註解/取消註解 (`Ctrl-/`)
- **狀態列** - 顯示游標位置和編輯器狀態
- **搜尋和取代** - 內建搜尋功能

## 安裝

### 使用 npm/yarn

```bash
npm install codemirror-v6-demo
# 或
yarn add codemirror-v6-demo
```

### 使用 CDN

從您的 CDN 或本地建置引入檔案：

```html
<link rel="stylesheet" href="path/to/dist/main/MKCodeMirror5.css">
<script src="path/to/dist/main/MKCodeMirror5.iife.js"></script>
```

## 使用方法

### 基本設定

```typescript
import { createEditor } from 'codemirror-v6-demo';

// 建立編輯器實例
const { editor, libController } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'javascript',
  value: 'console.log("Hello, World!");',
});
```

### 設定選項

```typescript
interface CreateEditorOptions {
  // CodeMirror 設定選項
  mode?: string;           // 語言模式（例如：'javascript', 'python'）
  value?: string;          // 初始編輯器內容
  theme?: string;          // 編輯器主題（預設：'dracula'）
  lineNumbers?: boolean;   // 顯示行號（預設：true）
  
  // 自訂選項
  indentSize?: number;     // 自訂縮排大小
  parent?: HTMLElement;    // 要附加編輯器的父元素
  container?: HTMLElement; // 自訂容器元素
  textareaID?: string;     // 自訂 textarea ID
  
  // ... 以及所有其他 CodeMirror.EditorConfiguration 選項
}
```

### 範例：使用 Pyodide 的 Python 編輯器

```typescript
import { createEditor } from 'codemirror-v6-demo';
import { WorkerPool } from 'codemirror-v6-demo/runner/python';

// 建立 Python 編輯器
const { editor } = await createEditor({
  parent: document.getElementById('app'),
  mode: 'python',
  value: 'print("Hello from Python!")',
});

// 設定 Python 執行
const outputEl = document.getElementById('output');
const appendOutput = createDefaultOutputHandler(outputEl);
const workerPool = new WorkerPool(1, appendOutput);

// 執行 Python 程式碼
document.getElementById('run-btn').addEventListener('click', async () => {
  const code = editor.getValue();
  await workerPool.execute(code);
});
```

## 開發

### 先決條件

- Node.js（版本見 `.nvmrc` 檔案）
- Yarn 套件管理器

### 設定

```bash
# 複製儲存庫
git clone https://github.com/a3510377/CodeMirrorV5MKExt.git
cd CodeMirrorV5MKExt

# 安裝相依性
yarn install
```

### 開發命令

```bash
# 啟動開發伺服器
yarn dev

# 建置所有發行版
yarn build

# 建置特定目標
yarn build:main    # 建置主函式庫
yarn build:worker  # 建置 worker 檔案
yarn build:demo    # 建置示範應用

# 預覽生產建置
yarn preview

# 程式碼檢查
yarn lint

# 程式碼檢查並自動修復
yarn lint:fix
```

### 專案結構

```
CodeMirrorV5MKExt/
├── src/
│   ├── extensions/      # 編輯器擴充
│   │   ├── clickLineSelect.ts
│   │   ├── indentGuide.ts
│   │   ├── mkCommands/  # 自訂命令
│   │   ├── specialCharsShow.ts
│   │   └── statusbar.ts
│   ├── plugins/         # 編輯器外掛
│   ├── runner/          # 程式碼執行（Python/Pyodide）
│   ├── utils/           # 工具函式
│   └── index.ts         # 主要進入點
├── dist/                # 建置輸出
│   ├── main/           # 主函式庫建置
│   ├── worker/         # Worker 建置
│   └── demo/           # 示範應用
├── index.html           # 示範頁面
└── vite.*.config.ts    # 建置設定
```

## 鍵盤快捷鍵

| 快捷鍵 | 動作 |
|----------|--------|
| `Ctrl-Space` | 觸發自動補全 |
| `Ctrl-/` | 切換註解 |
| `Tab` | 智慧 Tab/縮排 |
| `Shift-Tab` | 減少縮排 |
| `Enter` | 智慧換行並縮排 |
| `Ctrl-D` | 選擇下一個匹配項 |
| `Shift-Ctrl-L` | 選擇所有匹配項 |
| `Ctrl-Alt-Up` | 在上方新增游標 |
| `Ctrl-Alt-Down` | 在下方新增游標 |
| `Alt-Up` | 上移行 |
| `Alt-Down` | 下移行 |
| `Ctrl-G` | 跳轉到行 |

## 瀏覽器支援

此函式庫支援所有支援以下特性的現代瀏覽器：
- ES6+ JavaScript 特性
- Web Workers
- CodeMirror 5

## 貢獻

歡迎貢獻！請隨時提交 Pull Request。

## 授權

有關授權資訊，請參閱儲存庫中的 LICENSE 檔案。

## 致謝

- 基於 [CodeMirror 5](https://codemirror.net/5/) 建置
- Python 執行由 [Pyodide](https://pyodide.org/) 驅動
- 使用 [Vite](https://vitejs.dev/) 進行建置和開發

## 相關連結

- [CodeMirror 5 文件](https://codemirror.net/5/doc/manual.html)
- [Pyodide 文件](https://pyodide.org/en/stable/)
