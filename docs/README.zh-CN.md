# [Web Tools](https://danburen.github.io/wtools/)

<div align="center">

**纯前端工具集 — 所有计算在浏览器本地完成**

[![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vuedotgithub&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)]()
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)]()
[![Element Plus](https://img.shields.io/badge/Element_Plus-409EFF?logo=element&logoColor=white)]()
[![ECharts 6](https://img.shields.io/badge/ECharts_6-AA344D?logo=apacheecharts&logoColor=white)]()
[![Pyodide](https://img.shields.io/badge/Pyodide_WASM-005B96?logo=python&logoColor=white)]()
[![ffmpeg.wasm](https://img.shields.io/badge/ffmpeg.wasm-229922?logo=ffmpeg&logoColor=white)]()

[English](README.md)

</div>

---

## 功能一览

| 工具 | 说明 |
|------|------|
| **Python 在线运行** | 基于 Pyodide WASM 的浏览器端 Python 解释器，支持标准库及按需加载第三方库（numpy / pandas 等） |
| **树形结构可视化** | 将 JSON 渲染为 ECharts 交互式树形图，支持自定义字段映射、4 种布局方向、圆形/矩形节点 |
| **树列表可视化** | 将制表符缩进文本（`├ └` 前缀）渲染为 D3 可折叠列表，自动匹配文件图标，支持行内注释 |
| **Java DTO 转 TypeScript** | 解析 Java DTO/VO 代码并生成 TypeScript 类型定义，自动映射基础类型与泛型容器 |
| **ZIP 压缩 / 解压** | 拖拽打包为 ZIP，解压支持 ZIP / RAR / 7z / TAR / GZ / XZ / BZ2，操作带进度条 |
| **MP4 转 GIF** | 基于 ffmpeg.wasm 的浏览器端视频转 GIF 工具，两遍 palettegen 色彩量化保证质量，支持自定义帧率、分辨率、起止时间 |

---

## 开始使用

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run lint       # 代码检查
```

### 内置优化

- **内容缓存** — 编辑器内容自动缓存（内存 + localStorage），切换工具或刷新页面不会丢失
- **懒加载** — 按工具路由懒加载，首屏只加载当前工具代码
- **跨工具通信** — 通过 sessionStorage 跨工具传递数据

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| 语言 | [TypeScript](https://www.typescriptlang.org/) |
| 构建 | [Vite 8](https://vite.dev/) |
| UI | [Element Plus](https://element-plus.org/) |
| 编辑器 | [CodeMirror 6](https://codemirror.net/) |
| 图表 | [ECharts 6](https://echarts.apache.org/) · [D3.js](https://d3js.org/) |
| Python | [Pyodide](https://pyodide.org/) (WebAssembly) |
| 存档 | [JSZip](https://stuk.github.io/jszip/) · [libarchive.js](https://github.com/nickdesaulniers/libarchive.js) |
| 视频 | [ffmpeg.wasm](https://github.com/niclasbrot/ffmpeg.wasm)（CDN 懒加载，~24MB WASM） |

---

<div align="center">
  <sub>Built with Vue 3 + Vite + ECharts · <a href="https://github.com/Danburen/wtools">GitHub</a></sub>
</div>
