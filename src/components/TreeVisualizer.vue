<template>
  <div class="tool-shell tree-shell">
    <!-- Header -->
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><Share /></el-icon>
            树形结构可视化
            <el-popover placement="right" :width="280" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">将 JSON 数据渲染为可交互的树形结构图，支持自定义字段映射与布局选项。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">交互操作</div>
                  <div class="info-text">点击节点展开/折叠 · 滚轮缩放 · 拖拽平移 · 悬停查看完整属性。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">注意事项</div>
                  <div class="info-text">JSON 需为嵌套结构，默认使用 name/children 字段。超大节点数（1000+）可能影响性能。</div>
                </div>
              </div>
            </el-popover>
            <span class="header-badge">v1.0</span>
          </h2>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div ref="mainLayoutRef" class="main-layout">
      <!-- Left: Input Panel -->
      <div v-show="inputVisible" class="input-panel" :style="{ width: inputWidth + 'px', flex: 'none' }">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><EditPen /></el-icon>
            JSON 输入
          </span>
          <div ref="configTriggerRef" class="panel-actions">
            <el-upload :show-file-list="false" :auto-upload="false" accept=".json" :on-change="handleFileUpload">
              <el-tooltip content="上传 .json 文件" placement="top">
                <el-button size="small" :icon="Upload" circle />
              </el-tooltip>
            </el-upload>
            <el-tooltip content="加载示例数据" placement="top">
              <el-button size="small" :icon="Refresh" circle @click="loadSampleData" />
            </el-tooltip>
            <el-tooltip content="清空输入" placement="top">
              <el-button size="small" :icon="Delete" circle @click="clearAll" />
            </el-tooltip>
            <el-tooltip content="图配置" placement="top">
              <el-button
                size="small"
                :icon="Setting"
                circle
                :class="{ 'is-active': configOpen }"
                @click="configOpen = !configOpen"
              />
            </el-tooltip>

            <!-- Config dropdown panel -->
            <div v-if="configOpen" ref="configDropdownRef" class="config-dropdown" @click.stop>
              <div class="cd-section">
                <div class="cd-section-title">字段映射</div>
                <div class="cd-row">
                  <div class="cd-field">
                    <label>标签字段</label>
                    <el-input v-model="labelField" placeholder="name" size="small" @change="onConfigChange" />
                  </div>
                  <div class="cd-field">
                    <label>子级字段</label>
                    <el-input v-model="childrenField" placeholder="children" size="small" @change="onConfigChange" />
                  </div>
                </div>
              </div>
              <div class="cd-section">
                <div class="cd-section-title">布局</div>
                <div class="cd-row">
                  <div class="cd-field">
                    <label>方向</label>
                    <el-select v-model="orientation" size="small" :teleported="false" @change="renderChart">
                      <el-option label="⬇ 从上到下" value="TB" />
                      <el-option label="➡ 从左到右" value="LR" />
                      <el-option label="⬅ 从右到左" value="RL" />
                      <el-option label="⬆ 从下到上" value="BT" />
                    </el-select>
                  </div>
                  <div class="cd-field">
                    <label>节点</label>
                    <el-select v-model="nodeShape" size="small" :teleported="false" @change="renderChart">
                      <el-option label="● 圆形" value="circle" />
                      <el-option label="▬ 矩形" value="rect" />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="textarea-wrapper">
          <el-input
            v-model="jsonInput"
            type="textarea"
            placeholder="在此粘贴 JSON 数据..."
            class="mono-textarea"
            @input="onInputChange"
          />
        </div>
        <div v-if="errorMsg" class="error-msg">
          <el-alert :title="errorMsg" type="error" show-icon :closable="false" />
        </div>
        <div class="render-bar">
          <el-button type="primary" size="default" :disabled="!jsonInput.trim()" round @click="renderChart">
            <el-icon style="margin-right: 4px"><Platform /></el-icon>
            渲染树形图
          </el-button>
          <span v-if="nodeCount > 0" class="node-count">
            <span class="node-dot" />
            共 {{ nodeCount }} 个节点
          </span>
          <span v-else class="node-count hint">
            输入 JSON 后点击渲染
          </span>
        </div>
      </div>

      <!-- Draggable splitter divider -->
      <div
        v-show="inputVisible" class="panel-divider" :class="{ dragging: isResizing }"
        @mousedown.prevent="startResize"
      >
        <div class="divider-grip">
          <span class="grip-dot" />
          <span class="grip-dot" />
          <span class="grip-dot" />
        </div>
        <el-tooltip content="收起输入面板" placement="top">
          <div class="divider-btn" @mousedown.stop @click="toggleInputPanel">
            <el-icon><DArrowLeft /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- Collapsed expand strip -->
      <div v-show="!inputVisible" class="expand-strip" @click="toggleInputPanel">
        <el-tooltip content="展开输入面板" placement="top">
          <div class="expand-btn">
            <el-icon><DArrowRight /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- Right: Chart Panel -->
      <div class="chart-panel">
        <div ref="chartContainer" class="chart-container" />
        <div v-if="!chartRendered" class="chart-placeholder">
          <el-empty :image-size="100" description="输入 JSON 或上传文件后点击「渲染树形图」" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Upload, Refresh, Delete, Platform, Share, EditPen, DArrowLeft, DArrowRight, Setting } from '@element-plus/icons-vue'
import { useContentCache } from '../utils/contentCache'

// --- Config State ---
const labelField = ref('name')
const childrenField = ref('children')
const orientation = ref<'TB' | 'LR' | 'RL' | 'BT'>('LR')
const nodeShape = ref<'circle' | 'rect'>('circle')

// --- Data State ---
const { content: jsonInput, isRestored } = useContentCache('tree-json-input', '')
const errorMsg = ref('')
const nodeCount = ref(0)
const chartRendered = ref(false)

// --- Resize & Collapse State ---
const inputWidth = ref(380)
const inputVisible = ref(true)
const isResizing = ref(false)
const mainLayoutRef = ref<HTMLDivElement>()
const MIN_INPUT_W = 220
const MAX_INPUT_W = 800

function startResize() {
  isResizing.value = true
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function doResize(e: MouseEvent) {
  if (!mainLayoutRef.value) return
  const rect = mainLayoutRef.value.getBoundingClientRect()
  let w = e.clientX - rect.left
  w = Math.max(MIN_INPUT_W, Math.min(MAX_INPUT_W, w))
  inputWidth.value = w
  // Trigger chart resize after a brief pause to let layout settle
  if (chartInstance) {
    clearTimeout(chartResizeTimer)
    chartResizeTimer = setTimeout(() => chartInstance?.resize(), 50)
  }
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function toggleInputPanel() {
  inputVisible.value = !inputVisible.value
  // Let DOM settle then resize chart
  setTimeout(() => chartInstance?.resize(), 80)
}

// --- Config Dropdown State ---
const configOpen = ref(false)
const configTriggerRef = ref<HTMLDivElement>()
const configDropdownRef = ref<HTMLDivElement>()

function onDocumentClick(e: MouseEvent) {
  if (!configOpen.value) return
  const target = e.target as Node
  const inTrigger = configTriggerRef.value?.contains(target)
  const inDropdown = configDropdownRef.value?.contains(target)
  if (!inTrigger && !inDropdown) {
    configOpen.value = false
  }
}

// --- Refs ---
const chartContainer = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
let chartResizeTimer: ReturnType<typeof setTimeout> | undefined

// --- Sample Data ---
function loadSampleData() {
  jsonInput.value = JSON.stringify({
    name: '实用前端工具',
    itemStyle: { color: '#5b73e0', borderColor: '#3d56c2', borderWidth: 2 },
    children: [
      {
        name: '核心模块',
        itemStyle: { color: '#48b884' },
        children: [
          {
            name: 'ZIP 压缩',
            value: '打包·进度·加密',
            itemStyle: { color: '#6bc0e0' },
            children: [
              { name: '多文件压缩', value: '拖拽打包', itemStyle: { color: '#a8d8ea' } },
              { name: '进度条', value: '实时进度', itemStyle: { color: '#a8d8ea' } },
              { name: '密码保护', value: '加密压缩', itemStyle: { color: '#a8d8ea' } }
            ]
          },
          {
            name: 'ZIP 解压',
            value: 'zip·rar·7z·tar',
            itemStyle: { color: '#f5a623' },
            children: [
              { name: 'ZIP 格式', value: '标准解压', itemStyle: { color: '#f9d58b' } },
              { name: 'RAR 格式', value: 'rar支持', itemStyle: { color: '#f9d58b' } },
              { name: '7z 格式', value: '7z支持', itemStyle: { color: '#f9d58b' } }
            ]
          },
          {
            name: 'Java → TS',
            value: '类型·泛型·警告',
            itemStyle: { color: '#a855f7' },
            children: [
              { name: '类型映射', value: 'String→string', itemStyle: { color: '#c084fc' } },
              { name: '泛型支持', value: 'List<T>→T[]', itemStyle: { color: '#c084fc' } },
              { name: '警告标记', value: 'FIXME 未知类型', itemStyle: { color: '#c084fc' } }
            ]
          }
        ]
      },
      {
        name: '基础架构',
        itemStyle: { color: '#f56c6c' },
        children: [
          { name: 'Vue 3 + TypeScript', value: '框架栈', itemStyle: { color: '#f89898' } },
          { name: 'Element Plus UI', value: '组件库', itemStyle: { color: '#f89898' } },
          { name: 'Vite 构建', value: '构建工具', itemStyle: { color: '#f89898' } }
        ]
      },
      {
        name: '新工具',
        itemStyle: { color: '#3ba272' },
        children: [
          { name: '树形结构可视化', value: '当前工具', itemStyle: { color: '#7ecf9e' } },
          { name: '更多工具...', value: '待添加', itemStyle: { color: '#7ecf9e' } }
        ]
      }
    ]
  }, null, 2)
  onInputChange()
  nextTick(() => renderChart())
}

// --- Core Logic ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>

interface TreeNode {
  name: string
  value?: string | number
  children?: TreeNode[]
  itemStyle?: Record<string, unknown>
  label?: Record<string, unknown>
  [key: string]: unknown
}

function buildEChartsTree(data: unknown, labelKey: string, childKey: string): TreeNode | null {
  if (data === null || data === undefined) return null

  // If data is a primitive, wrap it
  if (typeof data !== 'object') {
    return { name: String(data) }
  }

  // If data is an array, create a virtual root
  if (Array.isArray(data)) {
    const children = data
      .map(item => buildEChartsTree(item, labelKey, childKey))
      .filter((n): n is TreeNode => n !== null)
    if (children.length === 0) return { name: '(empty array)' }
    return { name: 'root', children }
  }

  const d = data as Obj
  // Object: extract label and children
  const label = d[labelKey] !== undefined ? String(d[labelKey]) : (d.name || d.id || 'node')
  const node: TreeNode = { name: label }

  // Copy value if exists
  if (d.value !== undefined) node.value = d.value

  // Pass through ECharts-specific visual config
  if (d.itemStyle !== undefined) node.itemStyle = d.itemStyle as Record<string, unknown>
  if (d.label !== undefined) node.label = d.label as Record<string, unknown>

  // Copy all other primitive fields for tooltip
  for (const key of Object.keys(d)) {
    if (key !== labelKey && key !== childKey && key !== 'value' && key !== 'itemStyle' && key !== 'label' && typeof d[key] !== 'object') {
      node[key] = d[key]
    }
  }

  // Process children
  const rawChildren = d[childKey]
  if (Array.isArray(rawChildren) && rawChildren.length > 0) {
    const mapped = rawChildren
      .map((child: unknown) => buildEChartsTree(child, labelKey, childKey))
      .filter((n): n is TreeNode => n !== null)
    if (mapped.length > 0) {
      node.children = mapped
    }
  }

  return node
}

function countNodes(node: TreeNode | null): number {
  if (!node) return 0
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

function parseJsonInput(): unknown {
  try {
    const trimmed = jsonInput.value.trim()
    if (!trimmed) return null
    return JSON.parse(trimmed)
  } catch (e) {
    errorMsg.value = `JSON 解析错误: ${(e as Error).message}`
    return null
  }
}

function onInputChange() {
  errorMsg.value = ''
  // Auto-render if there's no error and some input
  if (jsonInput.value.trim()) {
    const data = parseJsonInput()
    if (data) {
      const tree = buildEChartsTree(data, labelField.value, childrenField.value)
      if (tree) {
        nodeCount.value = countNodes(tree)
      }
    }
  } else {
    nodeCount.value = 0
  }
}

function onConfigChange() {
  if (chartRendered.value && jsonInput.value.trim()) {
    renderChart()
  }
}

function renderChart() {
  if (!chartContainer.value) return

  const data = parseJsonInput()
  if (!data) return

  const tree = buildEChartsTree(data, labelField.value, childrenField.value)
  if (!tree) {
    errorMsg.value = '无法从 JSON 构建树形结构'
    return
  }

  nodeCount.value = countNodes(tree)
  errorMsg.value = ''
  chartRendered.value = true

  // Initialize chart if needed
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  const isLR = orientation.value === 'LR' || orientation.value === 'RL'

  // Determine initial tree depth based on total nodes
  const initialDepth = nodeCount.value > 50 ? 2 : nodeCount.value > 20 ? 3 : 4

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e5ed',
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 14],
      textStyle: { fontSize: 12, color: '#374151' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const data = params.data as Obj
        let html = `<div style="font-weight:700;font-size:13px;color:#1a1a2e;margin-bottom:4px;">${data.name}</div>`
        let fields = ''
        for (const key of Object.keys(data)) {
          if (key !== 'name' && key !== 'children') {
            const val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
            fields += `<div style="display:flex;gap:8px;font-size:12px;line-height:1.8;"><span style="color:#9ca3af;min-width:50px;">${key}</span><span style="color:#374151;">${val}</span></div>`
          }
        }
        if (fields) {
          html += `<div style="margin-top:4px;padding-top:6px;border-top:1px solid #f0f1f5;">${fields}</div>`
        }
        return html
      }
    },
    series: [{
      type: 'tree',
      data: [tree],
      top: 24,
      bottom: 24,
      left: isLR ? 48 : 24,
      right: isLR ? 80 : 24,
      layout: 'orthogonal',
      orient: orientation.value,
      roam: true,
      expandAndCollapse: true,
      initialTreeDepth: initialDepth,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
      lineStyle: {
        color: '#d4d8e0',
        width: 1.5,
        curveness: 0.55
      },
      label: {
        position: isLR ? 'right' : 'top',
        offset: isLR ? [10, 0] : [0, 8],
        fontSize: 12,
        color: '#374151',
        fontWeight: 500,
        textShadowBlur: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          return params.data.name as string
        }
      },
      leaves: {
        label: {
          position: isLR ? 'right' : 'bottom',
          offset: isLR ? [10, 0] : [0, 8]
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      symbolSize: (_value: number, params: any) => {
        const depth = params.depth || 0
        return Math.max(7, 15 - depth * 1.8)
      },
      symbol: nodeShape.value === 'rect' ? 'roundRect' : 'circle',
      color: [
        '#5b73e0', '#48b884', '#f5a623', '#f56c6c',
        '#6bc0e0', '#3ba272', '#e8855c', '#a855f7'
      ],
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        shadowBlur: 4,
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffsetY: 2
      },
      emphasis: {
        focus: 'descendant',
        lineStyle: {
          color: '#5b73e0',
          width: 2
        }
      }
    }]
  }

  chartInstance.setOption(option, true)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleFileUpload(uploadFile: any) {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    try {
      JSON.parse(text) // validate
      jsonInput.value = text
      onInputChange()
      nextTick(() => renderChart())
      ElMessage.success('JSON 文件已加载')
    } catch {
      ElMessage.error('文件内容不是有效的 JSON')
    }
  }
  reader.readAsText(file)
}

function clearAll() {
  jsonInput.value = ''
  errorMsg.value = ''
  nodeCount.value = 0
  chartRendered.value = false
  if (chartInstance) {
    chartInstance.clear()
  }
}

// --- Resize Observer ---
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  document.addEventListener('click', onDocumentClick)

  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })
    resizeObserver.observe(chartContainer.value)
  }

  // Load data sent from ListTreeVisualizer
  const stored = sessionStorage.getItem('list-tree-export')
  if (stored) {
    sessionStorage.removeItem('list-tree-export')
    try {
      const parsed = JSON.parse(stored)
      jsonInput.value = JSON.stringify(parsed, null, 2)
      onInputChange()
      nextTick(() => renderChart())
      return
    } catch { /* ignore */ }
  }

  // Load sample data only on first-time visit (no cache)
  if (!isRestored) {
    loadSampleData()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.tree-shell {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 24px;
}

/* ============================
   Container overrides (extends global .tool-shell)
   ============================ */
.tree-shell :deep(.shell-header) {
  flex-shrink: 0;
  margin-bottom: 18px;
}

/* ============================
   Config Dropdown (gear icon)
   ============================ */
.config-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 310px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 14px 16px;
  z-index: 200;
}
.cd-section + .cd-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f1f5;
}
.cd-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #9ca3af;
  margin-bottom: 8px;
}
.cd-row {
  display: flex;
  gap: 10px;
}
.cd-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cd-field label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

/* Gear active state */
.is-active {
  color: #5b73e0 !important;
  background: #eef0ff !important;
  border-color: #d4dcff !important;
}

.render-bar {
  flex-shrink: 0;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ============================
   Chart Panel
   ============================ */
.chart-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
}
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.2s;
}
.chart-container:hover {
  border-color: #d4dcff;
}
.chart-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed #e2e5ed;
  border-radius: 10px;
  background: #fafbfc;
}
.chart-placeholder :deep(.el-empty__description) {
  font-size: 13px;
  color: #9ca3af;
}

/* ============================
   Wide Screen - expand padding
   ============================ */
@media (min-width: 1400px) {
  .tree-shell {
    padding: 28px;
  }
}
@media (min-width: 1800px) {
  .tree-shell {
    padding: 32px;
  }
}
</style>
