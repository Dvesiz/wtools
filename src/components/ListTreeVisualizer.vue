<template>
  <div class="tool-shell list-shell">
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><Folder /></el-icon>
            树列表可视化
            <el-popover placement="right" :width="280" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">将文本格式的树形结构（如目录树、模块清单）渲染为可折叠的 D3 列表视图，支持文件图标识别与内联注释。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">输入格式</div>
                  <div class="info-text">使用 ├─ └─ │ 等制表符绘制的树形文本，各层级深度由前缀缩进决定。注释行以 # 开头，内联注释使用「 # 」分隔。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">导出功能</div>
                  <div class="info-text">支持导出为 TreeVisualizer 兼容的 JSON 格式，可直接在「树形结构可视化」工具中打开继续编辑。</div>
                </div>
              </div>
            </el-popover>
          </h2>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <div class="input-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><EditPen /></el-icon>
            树形文本输入
          </span>
          <div class="panel-actions">
            <el-upload :show-file-list="false" :auto-upload="false" accept=".txt,.md" :on-change="handleFileUpload">
              <el-tooltip content="上传 .txt 文件" placement="top">
                <el-button size="small" :icon="Upload" circle />
              </el-tooltip>
            </el-upload>
            <el-tooltip content="加载示例数据" placement="top">
              <el-button size="small" :icon="Refresh" circle @click="loadSample" />
            </el-tooltip>
            <el-tooltip content="清空输入" placement="top">
              <el-button size="small" :icon="Delete" circle @click="clearAll" />
            </el-tooltip>
            <el-tooltip content="保存" placement="top">
              <el-button size="small" :icon="Select" circle @click="handleSave" />
            </el-tooltip>
            <el-tooltip content="复制内容" placement="top">
              <el-button size="small" :icon="CopyDocument" circle @click="handleCopy" />
            </el-tooltip>
          </div>
        </div>
        <div class="textarea-wrapper">
          <el-input
            ref="rawTextInputRef"
            :model-value="rawText"
            type="textarea"
            placeholder="在此粘贴树形文本..."
            class="mono-textarea"
            @scroll="captureScroll"
            @input="onRawTextInput"
          />
        </div>
        <div v-if="errorMsg" class="error-msg">
          <el-alert :title="errorMsg" type="error" show-icon :closable="false" />
        </div>
        <div class="action-bar">
          <el-button type="primary" size="default" round :disabled="!rawText.trim()" @click="renderList">
            <el-icon style="margin-right: 4px"><Platform /></el-icon>
            渲染树列表
          </el-button>
          <span v-if="nodeCount > 0 && !errorMsg" class="node-count">
            <span class="node-dot" />
            共 {{ totalNodeCount }} 个节点
          </span>
        </div>

        <div v-if="nodeCount > 0" class="export-bar">
          <el-button size="small" :icon="Download" @click="exportJSON">
            导出 JSON
          </el-button>
          <el-button size="small" :icon="Share" @click="sendToTreeVisualizer">
            在树形结构可视化中打开
          </el-button>
        </div>
      </div>

      <div class="list-panel">
        <div v-if="rendered" class="list-toolbar">
          <span class="toolbar-count">
            <span class="node-dot" />
            已渲染 {{ nodeCount }} / {{ totalNodeCount }} 个节点
          </span>
          <div class="toolbar-actions">
            <el-button size="small" :icon="Expand" @click="expandAll">展开全部</el-button>
            <el-button size="small" :icon="Fold" @click="collapseAll">全部折叠</el-button>
          </div>
        </div>
        <div v-if="!rendered" class="list-placeholder">
          <el-empty :image-size="100" description="输入树形文本后点击「渲染树列表」" />
        </div>
        <div v-show="rendered" ref="listContainer" class="list-container" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { captureScroll, preserveScroll } from '../utils/scrollPreserve'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Upload, Refresh, Delete, Platform, Folder, EditPen, Download, Share, Expand, Fold, Select, CopyDocument } from '@element-plus/icons-vue'
import * as d3 from 'd3'
import { saveAs } from 'file-saver'
import { getFileIconSVG } from '../utils/fileIcons'
import { useContentCache } from '../utils/contentCache'

// ─── Types ────────────────────────────────────────────────────────
interface TreeNode {
  name: string
  children?: TreeNode[]
  _collapsed: boolean
  _depth: number
  _isFile: boolean        // true = has file extension → show file icon
  _isComment: boolean     // true = standalone # line
  _comment: string        // inline comment after " # " (empty if none)
}

interface FlatNode {
  node: TreeNode
  depth: number
  hasChildren: boolean
  isFile: boolean
  isComment: boolean
  inlineComment: string
}

// ─── State ────────────────────────────────────────────────────────
const router = useRouter()
const { content: rawText, isRestored, save: saveCode } = useContentCache('list-raw-text', '')
const errorMsg = ref('')
const rawTextInputRef = ref()

function onRawTextInput(val: string) {
  preserveScroll(rawTextInputRef, () => { rawText.value = val })
}
const nodeCount = ref(0)
const totalNodeCount = ref(0)
const rendered = ref(false)
const listContainer = ref<HTMLDivElement>()

let treeRoot: TreeNode | null = null

// ─── Sample Data ──────────────────────────────────────────────────
import sampleText from '../sample/list_chart.txt?raw'

function loadSample() {
  rawText.value = sampleText
  errorMsg.value = ''
  nextTick(() => renderList())
}

// ─── Text Parser ──────────────────────────────────────────────────
function parseLine(line: string): { depth: number; content: string } | null {
  const trimmed = line.trimEnd()
  if (!trimmed) return null

  let depth = 0
  let pos = 0
  while (pos + 4 <= trimmed.length) {
    const chunk = trimmed.substring(pos, pos + 4)
    if (chunk === '│   ' || chunk === '    ') {
      depth++
      pos += 4
    } else {
      break
    }
  }

  const rest = trimmed.substring(pos)
  const branchMatch = rest.match(/^[├└]─\s*/)
  if (branchMatch) {
    depth++
    const content = rest.substring(branchMatch[0].length).trim()
    return content ? { depth, content } : null
  }

  const content = rest.trim()
  return content ? { depth, content } : null
}

/** Determine if a name has a file extension (e.g. file.ts → file)
 *  Uses regex to avoid false-positives like '1.1 数据' or '2.3 模块'. */
function hasFileExtension(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot >= name.length - 1) return false
  // The extension must be pure alphanumeric (no spaces)
  return /^[a-zA-Z0-9]+$/.test(name.substring(dot + 1))
}

/** Split inline comment: 'data.db # database' → { name:'data.db', comment:'database' } */
function splitInlineComment(raw: string): { name: string; comment: string } {
  const idx = raw.indexOf(' # ')
  if (idx === -1) return { name: raw, comment: '' }
  return {
    name: raw.substring(0, idx).trim(),
    comment: raw.substring(idx + 3).trim(),
  }
}

function inferNodeType(node: TreeNode): void {
  if (node._isComment) return   // skip file/folder inference for comments
  node._isFile = hasFileExtension(node.name)
  if (node.children && node.children.length > 0) {
    // If it has children in the tree text, it's definitely a folder
    node._isFile = false
    node.children.forEach(child => inferNodeType(child))
  }
}

function parseTreeText(text: string): TreeNode | null {
  const lines = text.split('\n')
  const parsedItems: { depth: number; content: string }[] = []

  for (const line of lines) {
    const result = parseLine(line)
    if (result) parsedItems.push(result)
  }
  if (parsedItems.length === 0) return null

  const root: TreeNode = { name: parsedItems[0].content, _collapsed: false, _depth: 0, _isFile: false, _isComment: false, _comment: '', children: [] }
  const stack: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }]

  for (let i = 1; i < parsedItems.length; i++) {
    const { depth, content } = parsedItems[i]
    if (depth < 0) continue

    const isComment = content.startsWith('#')
    // For inline comments, split name and comment
    const { name, comment } = isComment ? { name: content, comment: '' } : splitInlineComment(content)
    const node: TreeNode = {
      name,
      _collapsed: false,
      _depth: depth,
      _isFile: false,
      _isComment: isComment,
      _comment: comment,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }
    if (stack.length > 0) {
      const parent = stack[stack.length - 1].node
      if (!parent.children) parent.children = []
      parent.children.push(node)
    }
    stack.push({ node, depth })
  }

  if (root.children?.length === 0) root.children = undefined
  inferNodeType(root)
  return root
}

// ─── Helpers ──────────────────────────────────────────────────────
function countTotalNodes(node: TreeNode): number {
  let count = 1
  if (node.children) {
    for (const child of node.children) count += countTotalNodes(child)
  }
  return count
}

function setAllCollapsed(node: TreeNode, collapsed: boolean) {
  node._collapsed = collapsed
  if (node.children) {
    for (const child of node.children) setAllCollapsed(child, collapsed)
  }
}

// ─── D3 Rendering ─────────────────────────────────────────────────
function flattenTree(root: TreeNode): FlatNode[] {
  const result: FlatNode[] = []
  function walk(node: TreeNode) {
    result.push({
      node,
      depth: node._depth,
      hasChildren: !!node.children?.length,
      isFile: node._isFile,
      isComment: node._isComment,
      inlineComment: node._comment,
    })
    if (node.children && !node._collapsed) {
      node.children.forEach(child => walk(child))
    }
  }
  walk(root)
  return result
}

const INDENT_STEP = 24

function updateList(root: TreeNode) {
  const container = listContainer.value
  if (!container) return

  const flat = flattenTree(root)
  nodeCount.value = flat.length

  // Data join using node identity (name + depth is unique)
  const rows = d3.select(container)
    .selectAll<HTMLDivElement, FlatNode>('.tree-row')
    .data(flat, d => d.node.name + String(d.depth))

  // EXIT: animate out then remove
  rows.exit()
    .transition()
    .duration(180)
    .style('opacity', 0)
    .style('height', 0)
    .remove()

  // ENTER: create new rows (hidden initially, then transition in)
  const enter = rows.enter()
    .append('div')
    .attr('class', 'tree-row')
    .style('opacity', 0)
    .style('height', 0)

  // Build each row's static structure once
  enter.each(function () {
    const row = d3.select(this)

    // Toggle button
    row.append('span').attr('class', 'toggle-btn').html(TOGGLE_SVG)

    // Folder/file icon
    row.append('span').attr('class', 'node-icon')

    // Label
    row.append('span').attr('class', 'row-label')

    // Inline comment (right-aligned, only shown when node has _comment)
    row.append('span').attr('class', 'row-comment')
  })

  // MERGE: update all rows' content and visibility
  const merged = enter.merge(rows)

  // Deep indent via padding-left on the row itself (no empty spacer div)
  merged.style('padding-left', d => `${6 + d.depth * INDENT_STEP}px`)

  // ── Comment rows ──
  merged.classed('comment-row', d => d.isComment)

  // Update toggle visibility + state (hidden for comments)
  merged.select('.toggle-btn')
    .style('display', d => d.isComment ? 'none' : d.hasChildren ? 'flex' : 'none')
    .classed('expanded', d => !d.isComment && d.hasChildren && !d.node._collapsed)

  // Update folder/file icon (hidden for comments)
  merged.select('.node-icon')
    .html(d => {
      if (d.isComment) return ''
      if (d.isFile) return getFileIconSVG(d.node.name)
      return d.node._collapsed ? FOLDER_CLOSED_SVG : FOLDER_OPEN_SVG
    })
    .style('display', d => d.isComment ? 'none' : 'flex')

  // Update label text
  merged.select('.row-label')
    .text(d => d.node.name)
    .classed('comment-label', d => d.isComment)

  // Update inline comment (right-aligned)
  merged.select('.row-comment')
    .text(d => d.inlineComment ? '# ' + d.inlineComment : '')
    .style('display', d => d.inlineComment ? '' : 'none')

  // ── Click handler on the ROW (has datum), not on child elements ──
  merged.on('click', function (event: MouseEvent, d: FlatNode) {
    if (d.isComment) return  // ignore clicks on comment rows
    if ((event.target as HTMLElement).closest('.toggle-btn')) {
      if (d.hasChildren) {
        d.node._collapsed = !d.node._collapsed
        updateList(root)
      }
    }
  })

  // Animate enter rows in
  if (rendered.value) {
    enter.transition()
      .duration(200)
      .style('opacity', 1)
      .style('height', '')
  } else {
    enter.style('opacity', 1).style('height', '')
  }

  rendered.value = true
}

// ─── SVG Templates ────────────────────────────────────────────────
const TOGGLE_SVG = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M3.5 1.5 L7.5 5 L3.5 8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

const FOLDER_CLOSED_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3 L8 3 L10 5 L14 5 L14 13 L2 13 Z" fill="#dce0f0" stroke="#5b73e0" stroke-width="1.2"/><path d="M2 3 L8 3 L10 5 L14 5 L14 13 L2 13 Z" fill="none" stroke="#5b73e0" stroke-width="1.2" opacity="0.5"/></svg>'

const FOLDER_OPEN_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3 L8 3 L10 5 L14 5 L14 13 L2 13 Z" fill="#dce0f0" stroke="#5b73e0" stroke-width="1.2" opacity="0.6"/><path d="M2 3 L8 3 L10 5 L14 5 L14 13 L2 13 Z" fill="none" stroke="#5b73e0" stroke-width="1.2"/></svg>'

// ─── Controller ───────────────────────────────────────────────────
function expandAll() {
  if (!treeRoot) return
  setAllCollapsed(treeRoot, false)
  updateList(treeRoot)
}

function collapseAll() {
  if (!treeRoot) return
  setAllCollapsed(treeRoot, true)
  updateList(treeRoot)
}

function renderList() {
  errorMsg.value = ''
  if (!rawText.value.trim()) {
    errorMsg.value = '请输入树形文本数据'
    return
  }
  try {
    const tree = parseTreeText(rawText.value)
    if (!tree) {
      errorMsg.value = '无法解析树形结构，请检查文本格式'
      return
    }
    treeRoot = tree
    totalNodeCount.value = countTotalNodes(tree)
    updateList(tree)
  } catch (e) {
    errorMsg.value = `解析错误: ${(e as Error).message}`
  }
}

// ─── Export ────────────────────────────────────────────────────────
function treeToJSON(node: TreeNode): Record<string, unknown> {
  const result: Record<string, unknown> = { name: node.name }
  if (node.children && node.children.length > 0) {
    result.children = node.children.map(child => treeToJSON(child))
  }
  return result
}

function exportJSON() {
  if (!treeRoot) return
  const json = treeToJSON(treeRoot)
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  saveAs(blob, 'tree-data.json')
  ElMessage.success('JSON 已导出')
}

function sendToTreeVisualizer() {
  if (!treeRoot) return
  const json = treeToJSON(treeRoot)
  sessionStorage.setItem('list-tree-export', JSON.stringify(json, null, 2))
  router.push('/tree-visualizer')
  ElMessage.success('数据已发送至树形结构可视化工具')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleFileUpload(uploadFile: any) {
  const file = uploadFile.raw
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text.trim()) {
      rawText.value = text
      ElMessage.success('文件已加载')
    } else {
      ElMessage.error('文件内容为空')
    }
  }
  reader.readAsText(file)
}

function clearAll() {
  rawText.value = ''
  errorMsg.value = ''
  nodeCount.value = 0
  totalNodeCount.value = 0
  rendered.value = false
  treeRoot = null
  if (listContainer.value) {
    d3.select(listContainer.value).selectAll('*').remove()
  }
}

function handleSave() {
  saveCode()
  ElMessage.success('已保存')
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(rawText.value)
    ElMessage.success('内容已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

onBeforeUnmount(() => {
  if (listContainer.value) {
    d3.select(listContainer.value).selectAll('*').remove()
  }
})

onMounted(() => {
  if (!isRestored) loadSample()
})
</script>

<style scoped>
.list-shell {
  padding: 24px;
}

.main-layout {
  gap: 16px;
}

.export-bar {
  flex-shrink: 0;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── List Panel ── */
.list-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  border: 1px solid #eef0f5;
  border-radius: 10px;
  background: #fff;
  overflow: auto;
}
.list-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed #e2e5ed;
  border-radius: 10px;
  background: #fafbfc;
}
.list-placeholder :deep(.el-empty__description) {
  font-size: 13px;
  color: #9ca3af;
}
.list-container {
  padding: 8px 4px;
  min-height: 100%;
}

/* ── List Toolbar (Vue template element) ── */
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #eef0f5;
  background: #fafbfc;
  border-radius: 10px 10px 0 0;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.toolbar-count {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* ── Wide Screen ── */
@media (min-width: 1400px) {
  .list-shell { padding: 28px; }
}
@media (min-width: 1800px) {
  .list-shell { padding: 32px; }
}
</style>

<style>
/* D3-generated tree rows — non-scoped because Vue scoped CSS doesn't
   apply to elements created at runtime via JavaScript/D3.
   Scoped via .list-container parent to avoid leaking. */
.list-container .tree-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 5px;
  cursor: default;
  user-select: none;
  overflow: hidden;
  height: 28px;
}
.list-container .tree-row:hover {
  background: #f5f7fa;
}

.list-container .toggle-btn {
  flex-shrink: 0;
  width: 18px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8e96a3;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
  margin-right: 2px;
}
.list-container .toggle-btn svg {
  transition: transform 0.2s ease;
}
.list-container .toggle-btn:hover {
  background: #eef0ff;
  color: #5b73e0;
}
.list-container .toggle-btn.expanded svg {
  transform: rotate(90deg);
}

.list-container .node-icon {
  flex-shrink: 0;
  width: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 2px;
}

.list-container .row-label {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.list-container .row-comment {
  margin-left: auto;
  font-style: italic;
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  padding-left: 8px;
}

/* ── Comment rows ── */
.list-container .comment-row {
  opacity: 0.75;
  pointer-events: none;
}
.list-container .comment-row .row-label {
  margin-left: auto;
  text-align: right;
  font-style: italic;
  font-size: 12px;
  color: #9ca3af;
}

/* ── Wider input panel ── */
.list-shell .input-panel {
  width: 480px;
}

</style>
