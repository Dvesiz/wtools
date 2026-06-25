# Vue Component Tree

```
App.vue
├── el-aside (desktop sidebar)
│   └── el-menu (6 items: index, java-to-ts, zip, tree-visualizer, list-tree, python-runner)
├── el-drawer (mobile menu)
│   └── el-menu (same 6 items)
├── router-view
│   ├── IndexView.vue
│   │   └── tool cards grid (5 cards, no sub-components)
│   ├── JavaToTsView.vue
│   │   └── JavaToTs.vue
│   │       ├── el-input (Java source code input)
│   │       └── el-input / pre (TypeScript output)
│   ├── ZipToolView.vue
│   │   └── ZipTool.vue
│   │       ├── el-upload (drag-drop file upload for compression)
│   │       ├── el-upload (drag-drop archive file for decompression)
│   │       └── el-progress (compression/decompression progress)
│   ├── TreeVisualizerView.vue
│   │   └── TreeVisualizer.vue
│   │       ├── el-input (JSON editor via CodeMirror 6)
│   │       └── ECharts chart container (tree diagram)
│   ├── ListTreeVisualizerView.vue
│   │   └── ListTreeVisualizer.vue
│   │       ├── el-input (indented text editor)
│   │       └── D3.js SVG (collapsible tree)
│   └── PythonRunnerView.vue
│       └── PythonRunner.vue
│           ├── CodeMirror 6 editor (Python code)
│           ├── el-button (Run)
│           ├── el-progress / steps (init/download progress)
│           └── pre (output with ANSI→HTML rendering)
└── a.github-corner (fixed position SVG)
```

## Shared Dependencies
- All tools use `useContentCache()` from `contentCache.ts` for editor state persistence
- No shared state between tools (isolated via route switch + sessionStorage for cross-tool data)

## Data Flow Per Tool
| Tool | Input | Processing | Output |
|------|-------|------------|--------|
| JavaToTs | Java source text | Regex-based parser + type mapper | TypeScript interface text |
| ZipTool | File[] (drag-drop) | JSZip/libarchive.js | Blob download / extracted files |
| TreeVisualizer | JSON text (CM6) | Custom JSON parse + ECharts option builder | ECharts SVG/Canvas |
| ListTreeVisualizer | Indented text (CM6) | Custom parser → D3 hierarchy | D3 SVG collapsible tree |
| PythonRunner | Python code (CM6) | Pyodide WASM interpreter | ANSI-colored text output |
