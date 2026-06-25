/**
 * echartsManager — ECharts CDN 懒加载管理器
 *
 * 类似 ffmpegManager / pyodideManager 的 CDN 懒加载模式。
 * ECharts UMD 包 (~1.1MB) 通过 script 标签动态加载，
 * 加载后通过 window.echarts 全局 API 使用。
 */

import { ECHARTS_CDN } from './config'

export type EChartsLoadState = 'idle' | 'loading' | 'ready' | 'error'

let loadPromise: Promise<void> | null = null
let state: EChartsLoadState = 'idle'

/** 当前加载状态 */
export function getEChartsState(): EChartsLoadState {
  return state
}

/**
 * 懒加载 ECharts（幂等，多次调用只加载一次）
 * @param onProgress 加载进度回调（simulated progress for script download）
 */
export async function loadECharts(
  onProgress?: (percent: number, message: string) => void,
): Promise<void> {
  if (state === 'ready') return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    state = 'loading'
    onProgress?.(10, '开始加载 ECharts 图表库...')

    // 如果已经有全局 echarts（可能来自其他组件），直接复用
    if ((window as any).echarts) {
      state = 'ready'
      onProgress?.(100, 'ECharts 图表库已就绪（复用）')
      return
    }

    onProgress?.(20, '从 CDN 下载 ECharts (~1.1MB)...')

    try {
      await loadScript(ECHARTS_CDN)

      if (!(window as any).echarts) {
        throw new Error('ECharts 加载后未找到全局变量')
      }

      onProgress?.(90, 'ECharts 初始化中...')

      // ECharts UMD 全量包已预注册所有组件，无需额外 use()
      state = 'ready'
      onProgress?.(100, 'ECharts 图表库已就绪')
    } catch (e) {
      state = 'error'
      throw e
    }
  })()

  return loadPromise
}

/** 重置状态（用于重试） */
export function resetECharts(): void {
  state = 'idle'
  loadPromise = null
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 避免重复加载
    if (document.querySelector(`script[data-echarts-src="${url}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = url
    script.dataset.echartsSrc = url
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`脚本加载失败: ${url}`))
    document.head.appendChild(script)
  })
}

/**
 * 获取 ECharts 全局对象（需先确保 loadECharts 完成）
 * 返回类型使用 any 避免依赖 echarts 类型定义
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getECharts(): any {
  return (window as any).echarts
}
