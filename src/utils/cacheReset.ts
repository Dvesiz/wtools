/**
 * cacheReset — 重置 CDN 懒加载模块状态
 *
 * 当用户遇到加载异常或希望强制重新下载 CDN 资源时调用。
 * 仅重置运行时状态，不清除 localStorage 中的编辑器缓存。
 */

import { resetFFmpeg } from './ffmpeg/ffmpegManager'
import { resetECharts } from './echarts/echartsManager'

/** 重置所有 CDN 懒加载模块的内存状态 */
export function resetCdnCache(): void {
  resetFFmpeg()
  resetECharts()
  // 后续新增的 CDN 懒加载模块也在此处注册
}
