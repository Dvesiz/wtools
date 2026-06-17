<template>
  <div class="tool-shell python-shell">
    <!-- Header -->
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><Monitor /></el-icon>
            Python 在线运行
            <el-popover placement="right" :width="300" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">基于 Pyodide 的浏览器端 Python 解释器。代码在本地运行，不经过任何服务器。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">首次使用</div>
                  <div class="info-text">自动从 GitHub 下载 Pyodide 运行时 (~30MB)，解压后缓存到 IndexedDB，一次下载永久使用。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">操作说明</div>
                  <div class="info-text">在编辑器中编写 Python 代码，点击「运行」执行。支持所有 Python 标准库。可拖动分隔条调整编辑区/运行区大小，点击分隔条箭头可收起编辑区。</div>
                </div>
              </div>
            </el-popover>
            <span class="header-badge">Pyodide 0.29</span>
          </h2>
          <el-tag v-if="isReady" type="success" size="small" effect="plain" round>已就绪</el-tag>
          <el-tag v-else-if="initError" type="danger" size="small" effect="plain" round>初始化失败</el-tag>
          <el-tag v-else type="warning" size="small" effect="plain" round>初始化中...</el-tag>
        </div>
      </div>
    </div>

    <!-- Main layout: resizable split -->
    <div ref="mainLayoutRef" class="main-layout">
      <!-- Left: Editor panel -->
      <div v-show="editorVisible" class="panel" :style="{ width: editorWidth + 'px', flex: 'none' }">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><EditPen /></el-icon>
            代码编辑器
          </span>
          <div class="panel-actions">
            <el-tooltip content="重置为默认代码" placement="top">
              <el-button size="small" :icon="Refresh" circle :disabled="running" @click="resetCode" />
            </el-tooltip>
            <el-tooltip content="清空输入" placement="top">
              <el-button size="small" :icon="Delete" circle :disabled="running" @click="clearCode" />
            </el-tooltip>
          </div>
        </div>
        <div ref="editorRef" class="cm-editor-wrap" />
      </div>

      <!-- Draggable split divider -->
      <div
        v-show="editorVisible"
        ref="dividerRef"
        class="panel-divider"
        :class="{ dragging: isResizing }"
        @pointerdown="startResize"
      >
        <div class="divider-grip">
          <span class="grip-dot" />
          <span class="grip-dot" />
          <span class="grip-dot" />
        </div>
        <el-tooltip content="收起编辑区" placement="top">
          <div class="divider-btn" @pointerdown.stop @click="toggleEditor">
            <el-icon><DArrowLeft /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- Editor collapsed expand strip -->
      <div v-show="!editorVisible" class="expand-strip" @click="toggleEditor">
        <el-tooltip content="展开编辑区" placement="top">
          <div class="expand-btn">
            <el-icon><DArrowRight /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- Output panel -->
      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><ChatLineSquare /></el-icon>
            {{ initError ? '错误信息' : isReady ? '运行输出' : '初始化进度' }}
          </span>
          <div class="panel-actions">
            <el-button
              size="small"
              :disabled="!isReady || running"
              type="primary"
              @click="runCode"
            >
              <el-icon style="margin-right: 4px"><VideoPlay /></el-icon>
              运行
            </el-button>
            <el-button v-if="isReady" size="small" text @click="output = ''">清空</el-button>
            <el-button
              v-if="!isReady && !initError && initPhase !== 'idle'"
              size="small"
              text
              disabled
            >
              初始化中...
            </el-button>
          </div>
        </div>

        <div class="output-content">
          <!-- State: init progress -->
          <div v-if="!isReady && !initError && initPhase !== 'idle'" class="init-progress">
            <div class="progress-label">{{ initPhaseLabel }}</div>
            <div v-if="activeMessage" class="progress-msg">{{ activeMessage }}</div>

            <!-- Step list -->
            <div
              v-for="s in steps"
              :key="s.name"
              class="step-row"
              :class="{ 'step-hidden': s.status === 'skipped', 'step-current': s.status === 'active' }"
            >
              <span class="step-icon">
                <el-icon v-if="s.status === 'done'" color="#67c23a"><SuccessFilled /></el-icon>
                <el-icon v-else-if="s.status === 'active'" color="#409eff" class="is-loading"><Loading /></el-icon>
                <el-icon v-else-if="s.status === 'error'" color="#f56c6c"><CircleCloseFilled /></el-icon>
                <el-icon v-else color="#4b5563"><InfoFilled /></el-icon>
              </span>
              <span class="step-label">{{ s.label }}</span>
            </div>
          </div>

          <!-- State: idle (no init started yet) -->
          <div v-else-if="!isReady && !initError && initPhase === 'idle'" class="output-placeholder">
            <span>正在启动...</span>
          </div>

          <!-- State: error -->
          <div v-else-if="initError" class="error-display">
            <p class="error-title">初始化失败</p>
            <pre class="error-detail">{{ initError }}</pre>
            <div class="error-actions">
              <el-button size="small" type="primary" @click="retryInit">重试</el-button>
              <el-button size="small" @click="clearAllCache">清除缓存并重试</el-button>
            </div>
          </div>

          <!-- State: ready -->
          <!-- eslint-disable-next-line vue/no-v-html -- output is user's own Python code, safe -->
          <pre v-else class="output-text" v-html="formattedOutput" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useContentCache } from '../utils/contentCache'
import { ansiToHtml } from '../utils/ansiToHtml'
import {
  Monitor, EditPen, VideoPlay, ChatLineSquare,
  SuccessFilled, Loading, CircleCloseFilled, InfoFilled,
  DArrowLeft, DArrowRight, Refresh, Delete,
} from '@element-plus/icons-vue'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { pythonEditorTheme } from '../utils/editor-theme'
import type { StepState } from '../utils/pyodide/pyodideManager'
import {
  checkCache, clearCache,
  downloadAndCacheFiles,
  initPyodide, runPythonCode,
  DEFAULT_CODE, createSteps,
} from '../utils/pyodide/pyodideManager'

// ── Editor / output state ──

const { content: code } = useContentCache('python-code', DEFAULT_CODE)
const output = ref('')
const running = ref(false)

// ── CodeMirror 6 ──

const editorRef = ref<HTMLDivElement>()
let editorView: EditorView | null = null
let suppressCodeSync = false
let resizeObserver: ResizeObserver | null = null
let isComposing = false

function createEditor() {
  const startState = EditorState.create({
    doc: code.value,
    extensions: [
      basicSetup,
      python(),
      EditorView.lineWrapping,
      pythonEditorTheme,
      keymap.of([indentWithTab]),
      // Sync editor changes back to code ref, but skip during IME composition
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isComposing) {
          suppressCodeSync = true
          code.value = update.state.doc.toString()
          suppressCodeSync = false
        }
      }),
      // Track IME composition to prevent interference with input sync
      EditorView.domEventHandlers({
        compositionstart() { isComposing = true; return false },
        compositionend() {
          isComposing = false
          // Composition finished — CM6 already applied the final text,
          // but updateListener was skipping, so sync the final state
          if (editorView) {
            suppressCodeSync = true
            code.value = editorView.state.doc.toString()
            suppressCodeSync = false
          }
          return false
        },
      }),
    ],
  })
  editorView = new EditorView({
    state: startState,
    parent: editorRef.value!,
  })

  // 随父容器尺寸变化重绘（拖拽分隔条、窗口缩放等）
  resizeObserver = new ResizeObserver(() => editorView?.requestMeasure())
  resizeObserver.observe(editorRef.value!)
}

watch(code, (newVal) => {
  if (suppressCodeSync || !editorView || isComposing) return
  const sel = editorView.state.selection.main
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: newVal },
    selection: { anchor: Math.min(sel.anchor, newVal.length) },
  })
})

// ── Init state ──

const isReady = ref(false)
const initError = ref('')
const initPhase = ref<'idle' | 'running' | 'done' | 'error'>('idle')
const steps = ref<StepState[]>(createSteps())
const activeMessage = ref('')

// ── Derived ──

const initPhaseLabel = computed(() => {
  const active = steps.value.find(s => s.status === 'active')
  return active ? active.label : ''
})

// Formatted output with ANSI → HTML conversion
const formattedOutput = computed(() => {
  if (running.value) return '▶ 运行中...'
  if (output.value) return ansiToHtml(output.value)
  return '点击「运行」执行代码'
})

// Replace step object to guarantee Vue reactivity
function setStep(name: StepState['name'], status: StepState['status'], percent = 0, message = '') {
  steps.value = steps.value.map(s =>
    s.name === name ? { ...s, status, percent, message } : s
  )
  if (status === 'active') {
    activeMessage.value = message
  }
}

// ── Init orchestration ──

async function doInit() {
  initError.value = ''
  initPhase.value = 'running'

  const cached = await checkCache()
  if (cached) {
    setStep('download', 'skipped')
    setStep('init', 'active')
  } else {
    setStep('download', 'active')
  }

  try {
    if (!cached) {
      // 流式逐文件下载 + 缓存
      setStep('download', 'active', 0, '准备下载...')
      await downloadAndCacheFiles(
        (name, bytes) => {
          const mb = (bytes / 1024 / 1024).toFixed(1)
          const msg = name.length > 20 ? `${name.slice(0, 18)}… (${mb}MB)` : `${name} (${mb}MB)`
          setStep('download', 'active', 0, msg)
        },
        (name, index, total) => {
          setStep('download', 'active', 0, `已缓存 ${name}（${index}/${total}）`)
        },
      )
      setStep('download', 'done')
      setStep('init', 'active')
    }

    await initPyodide((pct, msg) => {
      setStep('init', 'active', pct, msg)
    })

    setStep('init', 'done', 100)
    setStep('ready', 'done', 100)
    isReady.value = true
    initPhase.value = 'done'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    initError.value = msg
    initPhase.value = 'error'
    const active = steps.value.find(s => s.status === 'active')
    if (active) setStep(active.name as StepState['name'], 'error', active.percent, active.message)
  }
}

// ── Run Python ──

async function runCode() {
  if (!isReady.value || running.value) return
  running.value = true
  output.value = ''
  try {
    output.value = await runPythonCode(code.value, (msg) => {
      output.value += msg + '\n'
    })
    if (!output.value) {
      output.value = '(无输出)'
    }
  } catch (e: unknown) {
    output.value = `[错误] ${e instanceof Error ? e.message : String(e)}`
  } finally {
    running.value = false
  }
}

function resetCode() {
  code.value = DEFAULT_CODE
}

function clearCode() {
  code.value = ''
}

// ── Retry / reset ──

async function retryInit() {
  steps.value = createSteps()
  isReady.value = false
  initError.value = ''
  initPhase.value = 'idle'
  activeMessage.value = ''
  output.value = ''
  await nextTick()
  await doInit()
}

async function clearAllCache() {
  try {
    await clearCache()
  } catch { /* ignore */ }
  await retryInit()
}

// ── Resizable split pane ──

const MIN_EDITOR_W = 260
const MIN_OUTPUT_W = 200
const DIVIDER_W = 20
const DEFAULT_EDITOR_W = 560

const editorWidth = ref(DEFAULT_EDITOR_W)
const editorVisible = ref(true)
const isResizing = ref(false)
const mainLayoutRef = ref<HTMLDivElement>()
const dividerRef = ref<HTMLDivElement>()

function startResize(e: PointerEvent) {
  isResizing.value = true
  dividerRef.value?.setPointerCapture(e.pointerId)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function doResize(e: PointerEvent) {
  if (!isResizing.value || !mainLayoutRef.value) return
  const rect = mainLayoutRef.value.getBoundingClientRect()
  const maxW = rect.width - DIVIDER_W - MIN_OUTPUT_W
  let w = e.clientX - rect.left
  w = Math.max(MIN_EDITOR_W, Math.min(maxW, w))
  editorWidth.value = w
}

function stopResize(e: PointerEvent) {
  if (!isResizing.value) return
  isResizing.value = false
  dividerRef.value?.releasePointerCapture(e.pointerId)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function toggleEditor() {
  editorVisible.value = !editorVisible.value
}

// ── Lifecycle ──

onMounted(() => {
  doInit()
  createEditor()
  document.addEventListener('pointermove', doResize)
  document.addEventListener('pointerup', stopResize)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  editorView?.destroy()
  document.removeEventListener('pointermove', doResize)
  document.removeEventListener('pointerup', stopResize)
})
</script>

<style scoped>
.python-shell {
  padding: 20px;
}

/* ============================
   Header
   ============================ */

.python-shell :deep(.shell-header) {
  flex-shrink: 0;
  margin-bottom: 16px;
}

/* ============================
   CodeMirror 6 Editor
   ============================ */
.cm-editor-wrap {
  min-height: 0;
  border: 1px solid #e2e5ed;
  border-radius: 6px;
  overflow: scroll;
  overflow-y: auto;        /* 只保留纵向 */
  overflow-x: hidden;      /* 强制关闭横向 */
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* ============================
   Output Panel (right)
   ============================ */

.output-panel {
  flex: 1;
  min-width: 0;
}

/* ============================
   Output Content
   ============================ */

.output-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #1e293b;
  border-radius: 6px;
  padding: 14px;
}

.output-text {
  margin: 0;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
}

.output-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-size: 13px;
}

/* ============================
   Init Progress
   ============================ */

.init-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.progress-msg {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -6px;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  transition: opacity 0.3s;
}

.step-hidden {
  opacity: 0.3;
}

.step-current {
  color: #e2e8f0;
}

.step-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.step-icon .is-loading {
  animation: rotating 1.2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.step-label {
  flex-shrink: 0;
  font-weight: 500;
}

/* ============================
   Error display
   ============================ */

.error-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-title {
  margin: 0;
  color: #fca5a5;
  font-weight: 600;
  font-size: 14px;
}

.error-detail {
  margin: 0;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #f87171;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow: auto;
}

.error-actions {
  display: flex;
  gap: 8px;
}

/* ============================
   Wide screen
   ============================ */

@media (min-width: 1400px) {
  .python-shell {
    padding: 24px;
  }
}

@media (min-width: 1800px) {
  .python-shell {
    padding: 28px;
  }
}

</style>
