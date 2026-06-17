/**
 * Pyodide 下载与 CDN 配置
 *
 * 流程：
 * 1. 从 CDN 流式下载各个核心文件（无 GitHub 302 重定向）
 * 2. 每个文件下载完成后立即缓存到 IndexedDB
 * 3. 拦截器优先从缓存提供文件，未命中则回退到对应 CDN
 *
 * 两部分：
 * - Core  — pyodide.js、.wasm、.asm.js、.data
 * - Libs  — python_stdlib.zip、.so、.whl
 *
 * 修改 CDN_BASE 或 PYODIDE_VERSION_PATH 即可切换镜像或版本。
 */

/** jsDelivr 公共前缀 */
export const CDN_BASE = 'https://cdn.jsdelivr.net'

/** Pyodide 版本路径 */
export const PYODIDE_VERSION_PATH = '/pyodide/v0.29.4/full'

/** 核心文件 CDN 目录（需以 / 结尾） */
export const CORE_CDN = `${CDN_BASE}${PYODIDE_VERSION_PATH}/`

/** 库文件 CDN 目录（需以 / 结尾） */
export const LIBS_CDN = `${CDN_BASE}${PYODIDE_VERSION_PATH}/`

/**
 * 初始化时需要预加载的文件列表
 * 这些文件从 CORE_CDN 逐个流式下载并缓存到 IndexedDB，
 * 然后 loadPyodide() 从缓存加载。
 *
 * 对应 Pyodide 官方文档 "Files in pyodide-core-*.tar.bz2" 中的核心文件：
 * - pyodide.asm.js    — Emscripten 胶水代码（JS↔WASM 桥接）
 * - pyodide.asm.wasm  — Python 解释器 WebAssembly 二进制
 * - python_stdlib.zip — Python 标准库
 * - pyodide-lock.json — 包锁文件（loadPyodide 启动时自动读取）
 *
 * pyodide.js / pyodide.mjs 很小（~18KB），通过 <script> 加载，不做预下载。
 * 不在此列表中的文件（.so、.whl 等）由拦截器按需从 CDN 回退。
 */
export const PRELOAD_FILES = [
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'pyodide-lock.json',
  'python_stdlib.zip',
]