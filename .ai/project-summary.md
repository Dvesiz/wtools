# wtools — Project Summary (AI Entry Point)

## Identity
**wtools** = pure frontend toolkit. All computation in browser. No backend.
GitHub: `Danburen/wtools` → https://github.com/Danburen/wtools

## Stack (with versions)
| Layer | Tech | Version |
|-------|------|---------|
| Framework | Vue 3 (Composition API + `<script setup>`) | ^3.5.30 |
| Language | TypeScript | ~5.9.3 |
| Build | Vite | ^8.0.1 |
| UI Kit | Element Plus | ^2.13.6 |
| Icons | @element-plus/icons-vue | ^2.3.1 |
| Editor | CodeMirror 6 | ^6.0.2 |
| Charts | ECharts 6 + D3.js | ^6.1.0 / ^7.9.0 |
| Python | Pyodide WASM | v0.29.4 |
| Video | ffmpeg.wasm (CDN lazy) | v0.12.15 |
| Archive | JSZip + libarchive.js | ^3.10.1 / ^2.0.2 |
| Linter | ESLint (flat config) | ^10.5.0 |
| TS Check | vue-tsc | ^3.2.5 |

## Routes (7 total, all lazy-loaded)
| Path | Component | Tool Name |
|------|-----------|-----------|
| `/` | `IndexView.vue` | Home (tool cards) |
| `/java-to-ts` | `JavaToTsView.vue` → `JavaToTs.vue` | Java DTO → TypeScript |
| `/zip` | `ZipToolView.vue` → `ZipTool.vue` | ZIP compress/decompress |
| `/tree-visualizer` | `TreeVisualizerView.vue` → `TreeVisualizer.vue` | JSON → ECharts tree |
| `/list-tree` | `ListTreeVisualizerView.vue` → `ListTreeVisualizer.vue` | Indented text → D3 tree |
| `/python-runner` | `PythonRunnerView.vue` → `PythonRunner.vue` | Pyodide Python runner |
| `/video-to-gif` | `VideoToGifView.vue` → `VideoToGif.vue` | MP4 → GIF via ffmpeg.wasm |

## Pattern
- **View layer** (`src/views/`): thin wrapper, minimal logic, delegates to component.
- **Component layer** (`src/components/`): the actual tool implementation.
- **Utils** (`src/utils/`): shared logic (cache, archive, pyodide, editor theme, file icons, ANSI→HTML, scroll preserve).
- **Types** (`src/types/`): ambient type declarations (libarchive.js).
- **Sample data** (`src/sample/`): demo JSON tree, list chart text.

## Deploy
- Built with `npm run build` → outputs to `dist/`
- Base path: `/wtools/` (for GitHub Pages)
- CI: `.github/workflows/`

## Key Design Decisions
1. **No backend** — everything computed client-side via WASM (Pyodide) or pure JS (JSZip, CodeMirror, ECharts, D3).
2. **Dual cache** — editor state: memory (instant restore on tool switch) + localStorage (survives page reload), flushed every 2min + on beforeunload.
3. **Pyodide preload** — core files downloaded once to IndexedDB, fetch interceptor serves cache first, CDN fallback.
4. **ffmpeg.wasm CDN lazy** — MP4→GIF tool loads ~24MB WASM from jsDelivr on first use via toBlobURL, no npm install needed.
5. **Responsive** — desktop sidebar, mobile top-bar + drawer, GitHub corner.
