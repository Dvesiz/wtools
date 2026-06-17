# [Web Tools](https://danburen.github.io/wtools/)

<div align="center">

**A pure frontend toolkit — all computation happens locally in your browser.**

[![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vuedotgithub&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)]()
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)]()
[![Element Plus](https://img.shields.io/badge/Element_Plus-409EFF?logo=element&logoColor=white)]()
[![ECharts 6](https://img.shields.io/badge/ECharts_6-AA344D?logo=apacheecharts&logoColor=white)]()
[![Pyodide](https://img.shields.io/badge/Pyodide_WASM-005B96?logo=python&logoColor=white)]()

[中文](README.zh-CN.md)

</div>

---

## Features

| Tool | Description |
|------|-------------|
| **Python Runner** | In-browser Python interpreter powered by Pyodide WASM. Supports stdlib and on-demand third-party library loading (numpy, pandas, opencv-python, etc). |
| **Tree Visualizer** | Render JSON as interactive ECharts tree diagrams. Customizable label/children field mapping, 4 layout directions, round/rect nodes. |
| **List Tree Visualizer** | Render indented tree text (`├ └`) as D3 collapsible lists. Auto-detects file extensions for icons, supports inline comments. |
| **Java DTO → TypeScript** | Parse Java DTO/VO code and generate TypeScript type definitions. Maps Java types to TS (`String → string`, `Integer → number`, etc). |
| **ZIP Tool** | Multi-file archiver: compress to ZIP with drag-and-drop; extract ZIP / RAR / 7z / TAR / GZ / XZ / BZ2. Progress bar feedback. |

---

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Lint code
```

### Built-in Optimizations

- **Content caching** — Editor state auto-saved (memory + localStorage), survives tool switches and page refreshes
- **Lazy loading** — Route-level code splitting, only current tool loaded on first visit
- **Cross-tool communication** — Data sharing via sessionStorage

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| UI | [Element Plus](https://element-plus.org/) |
| Editor | [CodeMirror 6](https://codemirror.net/) |
| Charts | [ECharts 6](https://echarts.apache.org/) · [D3.js](https://d3js.org/) |
| Python | [Pyodide](https://pyodide.org/) (WebAssembly) |
| Archive | [JSZip](https://stuk.github.io/jszip/) · [libarchive.js](https://github.com/nickdesaulniers/libarchive.js) |

---

<div align="center">
  <sub>Built with Vue 3 + Vite + ECharts · <a href="https://github.com/Danburen/wtools">GitHub</a></sub>
</div>
