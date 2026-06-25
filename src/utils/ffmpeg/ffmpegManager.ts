/**
 * ffmpegManager — ffmpeg.wasm 懒加载管理器
 *
 * @ffmpeg/ffmpeg 已安装到 package.json，Vite 本地构建，
 * Worker 脚本（worker.js）由 Vite 自动打包为单独 chunk，
 * 从同域创建 module Worker，无 CORS 问题。
 *
 * @ffmpeg/core 仍然从 CDN 加载（~24MB），Worker 内通过
 * import(CDN_URL) 同域加载 ESM 核心。
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import type { LogEvent, ProgressEvent } from '@ffmpeg/ffmpeg'

import { CORE_JS, CORE_WASM } from './config'

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null

export type FfmpegStepLabel = 'loading' | 'ready' | 'error'

export interface FfmpegState {
  step: FfmpegStepLabel
  progress: number
  message: string
}

/** 获取 ffmpeg 实例（可能为 null） */
export function getFFmpeg(): FFmpeg | null {
  return ffmpegInstance
}

export async function loadFFmpeg(
  onProgress?: (state: FfmpegState) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  if (loadPromise) return loadPromise.then(() => ffmpegInstance!)

  loadPromise = (async () => {
    onProgress?.({ step: 'loading', progress: 10, message: '加载 ffmpeg.wasm 运行时代码...' })

    const ffmpeg = new FFmpeg()

    onProgress?.({ step: 'loading', progress: 30, message: '创建 FFmpeg 实例...' })

    // 保存 log/progress 监听引用，加载完成后清理，避免干扰后续业务调用
    const onLog = ({ message }: LogEvent) => {
      if (message.includes('frame=') || message.includes('Output')) {
        onProgress?.({ step: 'loading', progress: 50, message: message.slice(0, 80) })
      }
    }
    const onProgressEvt = ({ progress: p }: ProgressEvent) => {
      onProgress?.({ step: 'loading', progress: Math.round(50 + p * 40), message: `转换中 ${Math.round(p * 100)}%` })
    }
    ffmpeg.on('log', onLog)
    ffmpeg.on('progress', onProgressEvt)

    onProgress?.({ step: 'loading', progress: 50, message: '下载 WASM 核心 (~24MB)...' })

    // 加载核心
    // Worker 由 Vite 打包为本域文件，coreURL/wasmURL 为 CDN ESM 同源路径，
    // Worker 内 import(CDN_URL) 无 CORS 问题。
    await ffmpeg.load({
      coreURL: CORE_JS,
      wasmURL: CORE_WASM,
    })

    ffmpegInstance = ffmpeg
    onProgress?.({ step: 'ready', progress: 100, message: 'FFmpeg 核心已就绪' })

    // 加载完成后清除全局监听，组件在各自操作中按需注册临时监听
    ffmpeg.off('log', onLog)
    ffmpeg.off('progress', onProgressEvt)
  })()

  return loadPromise.then(() => ffmpegInstance!)
}

/** 重置（用于重试） */
export function resetFFmpeg(): void {
  ffmpegInstance = null
  loadPromise = null
}
