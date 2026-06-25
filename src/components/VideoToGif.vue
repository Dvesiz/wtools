<template>
  <div class="tool-shell unified-shell">
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><VideoCamera /></el-icon>
            MP4 转 GIF
            <el-popover placement="right" :width="300" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">基于 ffmpeg.wasm 在浏览器端将 MP4/WebM/MOV 等视频转换为 GIF 动图。所有处理在本地完成，视频不会上传至任何服务器。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">首次使用</div>
                  <div class="info-text">自动从 jsDelivr CDN 加载 ffmpeg.wasm 核心 (~24MB)，加载完成后可离线使用。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">参数说明</div>
                  <div class="info-text">FPS 控制帧率（越高越流畅，文件越大）。分辨率可缩放输出尺寸。起止时间截取片段。调色板颜色数减少可缩小文件体积。</div>
                </div>
              </div>
            </el-popover>
            <span class="header-badge">ffmpeg.wasm</span>
          </h2>
          <el-tag :type="readyTagConfig.type" size="small" effect="plain" round>{{ readyTagConfig.text }}</el-tag>
        </div>
      </div>
    </div>

    <!-- Core controls: compact layout below header -->
    <div v-if="readyState !== 'ready'" class="core-controls mb-4">
      <!-- Error banner -->
      <el-alert
        v-if="readyState === 'error'"
        title="核心加载失败"
        type="error"
        :description="loadMessage"
        show-icon
        :closable="false"
        class="mb-2"
      />

      <!-- Idle / Error (retry) → manual button -->
      <div v-if="readyState === 'idle'" class="load-action-bar">
        <el-button type="primary" @click="loadCore">加载 ffmpeg 核心</el-button>
        <span class="load-hint">首次需下载约 24MB WASM 文件</span>
      </div>
      <div v-else-if="readyState === 'error'" class="load-action-bar">
        <el-button type="primary" @click="retryLoad">重新加载 ffmpeg 核心</el-button>
        <span class="load-hint">点击重试，将重新从 CDN 下载核心文件</span>
      </div>

      <!-- Loading → progress -->
      <template v-if="readyState === 'loading'">
        <div v-if="loadMessage" class="load-msg">{{ loadMessage }}</div>
        <el-progress
          :percentage="loadPercent"
          :text-inside="true"
          :stroke-width="20"
          :status="loadPercent === 100 ? 'success' : undefined"
        />
      </template>
    </div>

    <!-- Main: Upload + Settings + Result -->
    <template v-if="readyState === 'ready'">
      <!-- Upload -->
      <div class="operation-area mb-4">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          :limit="1"
          :accept="acceptFormats"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽视频到此处，或 <em>点击选择视频文件</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 MP4 / WebM / MOV / AVI
            </div>
          </template>
        </el-upload>

        <!-- Video preview -->
        <div v-if="videoUrl" class="video-preview mt-4">
          <video
            ref="videoRef"
            :src="videoUrl"
            controls
            preload="metadata"
            class="preview-video"
            @loadedmetadata="onVideoMeta"
          />
        </div>
      </div>

      <!-- Settings -->
      <div v-if="videoUrl" class="operation-area mb-4">
        <h4>输出设置</h4>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="帧率 (FPS)">
              <el-select v-model="fps" style="width: 100%">
                <el-option :value="5" label="5 (小文件)" />
                <el-option :value="10" label="10 (适中)" />
                <el-option :value="15" label="15 (流畅)" />
                <el-option :value="24" label="24 (原帧率)" />
                <el-option :value="30" label="30 (高帧率)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分辨率">
              <el-select v-model="scaleWidth" style="width: 100%">
                <el-option :value="0" label="原始尺寸" />
                <el-option :value="320" label="320px" />
                <el-option :value="480" label="480px" />
                <el-option :value="640" label="640px" />
                <el-option :value="800" label="800px" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="起始时间 (秒)">
              <el-input-number v-model="startTime" :min="0" :max="maxStartTime" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="持续时间 (秒)">
              <el-input-number v-model="duration" :min="1" :max="maxDuration" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="mt-2">
          <el-col :span="6">
            <el-form-item label="调色板颜色数">
              <el-select v-model="paletteColors" style="width: 100%">
                <el-option :value="128" label="128 (小文件)" />
                <el-option :value="192" label="192 (适中)" />
                <el-option :value="256" label="256 (高质量)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="循环播放">
              <el-switch v-model="loop" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :loading="converting"
            :disabled="!videoUrl"
            @click="doConvert"
          >
            <el-icon style="margin-right:4px"><VideoPlay /></el-icon>
            {{ converting ? '转换中...' : '转换为 GIF' }}
          </el-button>
          <span v-if="videoDuration" class="video-info">
            视频: {{ formatDuration(videoDuration) }} &middot;
            {{ videoWidth }}×{{ videoHeight }}
          </span>
        </div>

      </div>

      <!-- Bottom bar: progress → download -->
      <div v-if="converting || gifUrl" class="bottom-bar">
        <template v-if="converting">
          <div class="bottom-bar-label">{{ convertMessage }}</div>
          <el-progress
            :percentage="convertPercent"
            :stroke-width="12"
            :text-inside="false"
            color="#409eff"
          />
          <div v-if="convertDetail" class="bottom-bar-detail">{{ convertDetail }}</div>
        </template>
        <template v-else>
          <div class="bottom-bar-row">
            <span class="bottom-bar-label">转换完成</span>
            <span class="bottom-bar-meta">
              GIF 大小: {{ formatSize(gifSize) }}
              <span v-if="gifDuration"> · 时长: {{ formatDuration(gifDuration) }}</span>
            </span>
          </div>
          <div class="bottom-bar-actions">
            <el-button type="primary" :icon="Download" @click="downloadGif">下载 GIF</el-button>
            <el-button @click="clearResult">重新选择</el-button>
          </div>
          <div class="bottom-bar-preview">
            <img :src="gifUrl" alt="GIF 预览" class="gif-preview" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoCamera, UploadFilled, VideoPlay, Download,
} from '@element-plus/icons-vue'
import type { ProgressEvent, LogEvent } from '@ffmpeg/ffmpeg'
import type { FfmpegState } from '../utils/ffmpeg/ffmpegManager'
import { loadFFmpeg, getFFmpeg, resetFFmpeg } from '../utils/ffmpeg/ffmpegManager'
import type { FFmpeg } from '@ffmpeg/ffmpeg'

// ── Accept formats ──

const acceptFormats = '.mp4,.webm,.mov,.avi'

// ── FFmpeg 核心状态 ──

const readyState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const loadPercent = ref(0)
const loadMessage = ref('')

const readyTagConfig = computed(() => {
  switch (readyState.value) {
    case 'ready':   return { type: 'success' as const, text: '核心已就绪' }
    case 'error':   return { type: 'danger' as const,  text: '加载失败' }
    case 'loading': return { type: 'warning' as const, text: '加载核心中...' }
    default:        return { type: 'info' as const,    text: '待加载' }
  }
})

onMounted(() => {
  // 如果 ffmpeg 实例已缓存（同会话中其他工具已加载），直接就绪
  if (getFFmpeg()) {
    readyState.value = 'ready'
  }
})

async function loadCore() {
  readyState.value = 'loading'
  loadPercent.value = 0
  loadMessage.value = '准备加载...'

  try {
    await loadFFmpeg((state: FfmpegState) => {
      if (state.step === 'loading') {
        loadPercent.value = state.progress
        loadMessage.value = state.message
      } else if (state.step === 'ready') {
        readyState.value = 'ready'
        loadPercent.value = 100
        loadMessage.value = state.message
      }
    })
  } catch (e: unknown) {
    readyState.value = 'error'
    loadMessage.value = e instanceof Error ? e.message : String(e)
  }
}

async function retryLoad() {
  resetFFmpeg()
  readyState.value = 'idle'
  loadPercent.value = 0
  loadMessage.value = ''
  await loadCore()
}

// ── Video file ──

const fileList = ref<any[]>([])
const videoUrl = ref('')
const videoRef = ref<HTMLVideoElement>()
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)

function handleFileChange(uploadFile: any) {
  const raw = uploadFile.raw
  if (!raw) return

  // 释放前一个 URL
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)

  videoUrl.value = URL.createObjectURL(raw)
  // 保持 fileList 只有一个元素
  fileList.value = [uploadFile]
  // 重置结果
  clearResult()
}

function onVideoMeta() {
  const v = videoRef.value
  if (v) {
    videoDuration.value = v.duration
    videoWidth.value = v.videoWidth
    videoHeight.value = v.videoHeight
    startTime.value = 0
    maxStartTime.value = Math.floor(v.duration)
    duration.value = Math.min(5, Math.floor(v.duration))
    maxDuration.value = Math.floor(v.duration)
  }
}

// ── Settings ──

const fps = ref(10)
const scaleWidth = ref(480)
const startTime = ref(0)
const duration = ref(5)
const maxStartTime = ref(0)
const maxDuration = ref(30)
const paletteColors = ref(192)
const loop = ref(true)

// ── Conversion ──

const converting = ref(false)
const convertPercent = ref(0)
const convertMessage = ref('')
const convertDetail = ref('')
const gifUrl = ref('')
const gifSize = ref(0)
const gifDuration = ref(0)

/**
 * 在 `ffmpeg.exec()` 期间临时监听 progress + log 事件。
 * - progress → 填充百分比进度（映射到 [rangeStart, rangeEnd]）
 * - log → 提取 ffmpeg 状态行（帧/码率/速度）显示在底部详情行
 * 返回 cleanup 函数，exec 结束后调用。
 */
function listenFfmpegExec(
  ffmpeg: FFmpeg,
  rangeStart: number,
  rangeEnd: number,
): () => void {
  const onProgress = ({ progress }: ProgressEvent) => {
    convertPercent.value = Math.round(rangeStart + progress * (rangeEnd - rangeStart))
  }
  const onLog = ({ message }: LogEvent) => {
    // ffmpeg log 行如: "frame=  120 fps=12.0 size=     512kB bitrate= 245.6kbits/s speed=1.02x"
    // 只取帧/时间/码率/速度 的摘要
    if (message.includes('frame=')) {
      const parts: string[] = []
      // frame
      const fm = message.match(/frame=\s*(\d+)/)
      if (fm) parts.push(`${fm[1]} 帧`)
      // time
      const tm = message.match(/time=\s*(\S+)/)
      if (tm) parts.push(tm[1])
      // bitrate
      const br = message.match(/bitrate=\s*(\S+)/)
      if (br) parts.push(br[1])
      // speed
      const sp = message.match(/speed=\s*(\S+)x/)
      if (sp) parts.push(`${sp[1]}x`)
      convertDetail.value = parts.join(' · ')
    }
  }
  ffmpeg.on('progress', onProgress)
  ffmpeg.on('log', onLog)
  return () => {
    ffmpeg.off('progress', onProgress)
    ffmpeg.off('log', onLog)
  }
}

async function doConvert() {
  if (!videoUrl.value || converting.value) return

  const ffmpeg = getFFmpeg()
  if (!ffmpeg) {
    ElMessage.error('FFmpeg 核心未加载')
    return
  }

  converting.value = true
  convertPercent.value = 0
  convertMessage.value = '准备转换...'
  convertDetail.value = ''
  gifUrl.value = ''
  gifSize.value = 0

  try {
    // ── 1. 读取视频文件 ──
    convertPercent.value = 5
    convertMessage.value = '读取视频文件...'
    const response = await fetch(videoUrl.value)
    const videoData = new Uint8Array(await response.arrayBuffer())

    // ── 2. 写入 WASM 虚拟文件系统 ──
    convertPercent.value = 10
    convertMessage.value = '写入虚拟文件系统...'
    await ffmpeg.writeFile('input.mp4', videoData)

    // ── 3. 构建 filter 链 ──
    const filters: string[] = []
    if (scaleWidth.value > 0) {
      filters.push(`scale=${scaleWidth.value}:-1:flags=lanczos`)
    }
    filters.push(`fps=${fps.value}`)
    const paletteFilter = filters.join(',')

    // ── 4. 第一遍：调色板生成 ──
    const paletteOpts = `palettegen=stats_mode=diff:max_colors=${paletteColors.value}`
    convertPercent.value = 15
    convertMessage.value = '分析色彩生成调色板'
    const cleanup1 = listenFfmpegExec(ffmpeg, 15, 50)
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', String(startTime.value),
      '-t', String(duration.value),
      '-vf', `${paletteFilter},${paletteOpts}`,
      '-y',
      'palette.png',
    ])
    cleanup1()

    // ── 5. 第二遍：输出 GIF ──
    const usePalette = loop.value
      ? 'paletteuse=dither=bayer:bayer_scale=5'
      : 'paletteuse=dither=bayer:bayer_scale=5'
    convertPercent.value = 55
    convertMessage.value = '应用调色板输出 GIF'
    const cleanup2 = listenFfmpegExec(ffmpeg, 55, 85)
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'palette.png',
      '-ss', String(startTime.value),
      '-t', String(duration.value),
      '-lavfi', `${paletteFilter} [x]; [x][1:v] ${usePalette}`,
      ...(loop.value ? [] : ['-loop', '1']),
      '-y',
      'output.gif',
    ])
    cleanup2()

    // ── 6. 读取输出 ──
    convertPercent.value = 90
    convertMessage.value = '读取输出数据...'
    convertDetail.value = ''
    const readData = await ffmpeg.readFile('output.gif')
    const data = readData instanceof Uint8Array ? readData : new Uint8Array()

    // ── 7. 生成预览 ──
    convertPercent.value = 95
    convertMessage.value = '生成 GIF 预览...'
    const blob = new Blob([data.slice()], { type: 'image/gif' })
    gifSize.value = data.length
    gifDuration.value = duration.value

    convertPercent.value = 100
    convertMessage.value = '转换完成 ✓'
    convertDetail.value = `${formatSize(gifSize.value)}`
    // 先渲染 100% 进度，再切换至结果视图
    await nextTick()

    gifUrl.value = URL.createObjectURL(blob)

    // 8. 清理虚拟文件系统
    ffmpeg.deleteFile('input.mp4')
    ffmpeg.deleteFile('palette.png')
    ffmpeg.deleteFile('output.gif')

    ElMessage.success('转换完成')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    ElMessage.error(`转换失败: ${msg}`)
  } finally {
    converting.value = false
  }
}

function downloadGif() {
  if (!gifUrl.value) return
  const a = document.createElement('a')
  a.href = gifUrl.value
  a.download = `output_${fps.value}fps_${scaleWidth.value}w.gif`
  a.click()
}

function clearResult() {
  if (gifUrl.value) {
    URL.revokeObjectURL(gifUrl.value)
  }
  gifUrl.value = ''
  gifSize.value = 0
  gifDuration.value = 0
  convertPercent.value = 0
}

// ── Helpers ──

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<style scoped>
/* ============================
   Core controls (compact loading)
   ============================ */
.core-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.load-action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.load-msg {
  font-size: 13px;
  color: #4b5563;
}
.load-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* ============================
   Video Preview
   ============================ */
.video-preview {
  max-width: 100%;
}
.preview-video {
  width: 100%;
  max-height: 360px;
  border-radius: 8px;
  background: #000;
}

/* ============================
   Bottom bar (progress → download)
   ============================ */
.bottom-bar {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.bottom-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.bottom-bar-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.bottom-bar-meta {
  font-size: 12px;
  color: #9ca3af;
}
.bottom-bar-detail {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bottom-bar-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.bottom-bar-preview {
  margin-top: 12px;
  max-width: 100%;
}
.gif-preview {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* ============================
   Video info
   ============================ */
.video-info {
  font-size: 12px;
  color: #9ca3af;
}

/* ============================
   Mobile responsive
   ============================ */
@media (max-width: 767px) {
  .load-action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .load-action-bar .el-button {
    width: 100%;
  }

  :deep(.el-col-6) {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }

  .action-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .action-bar .el-button {
    width: 100%;
  }
  .video-info {
    align-self: flex-start;
  }

  .bottom-bar-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .bottom-bar-actions {
    flex-wrap: wrap;
  }
  .bottom-bar-actions .el-button {
    flex: 1;
    min-width: 0;
  }
}
</style>
