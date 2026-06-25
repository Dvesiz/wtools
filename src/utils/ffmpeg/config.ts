/**
 * ffmpeg.wasm CDN 配置
 *
 * @ffmpeg/ffmpeg（含 Worker 创建代码）已安装到 package.json，
 * Vite 本地构建，Worker 同域创建，无 CORS 问题。
 *
 * @ffmpeg/core（~24MB WASM）仍然从 CDN 加载，
 * Worker 内通过 import() 同域加载 CDN ESM 核心。
 */

/** @ffmpeg/core ESM WASM 核心 CDN */
export const CORE_JS = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js'
export const CORE_WASM = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm'
