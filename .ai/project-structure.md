# Project File Map (For AI Navigation)

```
wtools/
├── .ai/                          # THIS DIRECTORY — AI context & project understanding
│   ├── project-summary.md        # One-shot project identity
│   ├── project-structure.md      # This file — full file tree
│   ├── component-tree.md         # Vue component hierarchy
│   ├── data-flow.md              # Caching, state, communication patterns
│   └── context/                  # Session context storage
├── .github/workflows/            # CI/CD (GitHub Pages deploy)
├── docs/
│   ├── README.md                 # English docs
│   └── README.zh-CN.md           # Chinese docs
├── public/                       # Static assets (favicon, etc.)
├── src/
│   ├── main.ts                   # App entry: mount Vue+ElementPlus+Router+icons+cache timer
│   ├── App.vue                   # Root: sidebar + mobile drawer + router-view + footer + GitHub corner
│   ├── style.css                 # Global CSS reset & base styles
│   ├── assets/                   # PNG/SVG assets (hero.png, vite.svg, vue.svg)
│   ├── types/
│   │   └── archive-wasm.d.ts     # Ambient module for libarchive.js (untyped)
│   ├── router/
│   │   └── index.ts              # 6 routes, hash history, lazy imports
│   ├── views/                    # Route-level pages (thin wrappers)
│   │   ├── IndexView.vue         # Homepage: tool cards grid
│   │   ├── JavaToTsView.vue      # Wraps JavaToTs component
│   │   ├── ZipToolView.vue       # Wraps ZipTool component
│   │   ├── TreeVisualizerView.vue # Wraps TreeVisualizer component
│   │   ├── ListTreeVisualizerView.vue # Wraps ListTreeVisualizer component
│   │   └── PythonRunnerView.vue  # Wraps PythonRunner component
│   ├── components/               # Tool implementations
│   │   ├── HelloWorld.vue        # Legacy/placeholder
│   │   ├── JavaToTs.vue          # Java DTO → TS parser
│   │   ├── ZipTool.vue           # ZIP compress/decompress UI
│   │   ├── TreeVisualizer.vue    # JSON → ECharts tree
│   │   ├── ListTreeVisualizer.vue # Indented text → D3 collapsible tree
│   │   └── PythonRunner.vue      # Pyodide Python runner UI
│   ├── utils/
│   │   ├── contentCache.ts       # Dual cache (memory+localStorage), composable `useContentCache()`
│   │   ├── editor-theme.ts       # CodeMirror 6 dark theme extension
│   │   ├── scrollPreserve.ts     # Prevent textarea scroll jump on reactivity
│   │   ├── ansiToHtml.ts         # ANSI escape → HTML spans with inline styles
│   │   ├── fileIcons.ts          # Extension→category→SVG icon for ListTreeVisualizer
│   │   ├── archive/
│   │   │   ├── zip.ts            # JSZip: compress/decompress single+multi file
│   │   │   └── libarchive.ts     # libarchive.js: decompress RAR/7z/TAR/GZ/XZ/BZ2
│   │   └── pyodide/
│   │       ├── config.ts         # CDN URLs, version (v0.29.4), preload file list
│   │       ├── package-name-map.ts # Python import → Pyodide package name mapping
│   │       └── pyodideManager.ts # Download, cache (IndexedDB), init, fetch interceptor, run code
│   └── sample/                   # Demo data
│       ├── business_flow_tree.json  # Sample JSON tree for TreeVisualizer
│       └── list_chart.txt          # Sample indented tree text for ListTreeVisualizer
├── index.html                    # Vite entry HTML
├── vite.config.ts                # Vite config (base: /wtools/, vue plugin)
├── tsconfig.json                 # Root TS config
├── tsconfig.app.json             # App TS config
├── tsconfig.node.json            # Node TS config (for vite.config)
├── eslint.config.js              # Flat ESLint config
├── package.json                  # Dependencies & scripts
├── .gitignore
├── .idea/                        # JetBrains IDE config
├── .vscode/                      # VS Code config
├── node_modules/
└── dist/                         # Build output
```

## File Counts
- Vue SFCs: 8 (1 App + 6 views + 1 legacy HelloWorld) + 6 components = 14
- TypeScript modules: ~12 (router, main, 5 utils, 3 pyodide, 2 archive, 1 types)
- Config files: 6+ (vite, 3×tsconfig, eslint, package.json)
