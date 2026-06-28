<template>
  <div class="tool-shell unified-shell markdown-word-shell">
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><Document /></el-icon>
            Markdown 转 Word
            <el-popover placement="right" :width="300" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">将 Markdown 文档转换为可编辑的 .docx 文件，支持标题、列表、表格、引用、代码块、链接和常见行内样式。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">加载方式</div>
                  <div class="info-text">Markdown 解析器和 Word 生成器只在点击转换时从 CDN 加载，不进入站点初始下载包。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">隐私</div>
                  <div class="info-text">转换在浏览器本地完成，文件内容不会上传到服务器。</div>
                </div>
              </div>
            </el-popover>
            <span class="header-badge">CDN 懒加载</span>
          </h2>
          <el-tag :type="statusTag.type" size="small" effect="plain" round>{{ statusTag.text }}</el-tag>
        </div>
      </div>
    </div>

    <div class="operation-area markdown-word-area">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="14">
          <div class="inline-panel-header">
            <h4>Markdown 内容</h4>
            <div class="panel-actions">
              <el-tooltip content="导入 .md 文件" placement="top">
                <el-button size="small" :icon="Upload" circle @click="pickFile" />
              </el-tooltip>
              <el-tooltip content="保存到浏览器" placement="top">
                <el-button size="small" :icon="Select" circle @click="handleSave" />
              </el-tooltip>
              <el-tooltip content="复制内容" placement="top">
                <el-button size="small" :icon="CopyDocument" circle @click="handleCopy" />
              </el-tooltip>
            </div>
          </div>
          <input ref="fileInputRef" type="file" accept=".md,.markdown,text/markdown,text/plain" hidden @change="onFileChange">
          <el-input
            ref="markdownInputRef"
            :model-value="markdown"
            type="textarea"
            :rows="22"
            class="mono-textarea"
            placeholder="# 文档标题&#10;&#10;粘贴 Markdown，或导入 .md 文件后转换为 Word。"
            @scroll="captureScroll"
            @input="onMarkdownInput"
          />
        </el-col>

        <el-col :xs="24" :sm="24" :md="10">
          <div class="inline-panel-header">
            <h4>导出设置</h4>
          </div>
          <el-form label-position="top">
            <el-form-item label="导出文件名">
              <el-input v-model="fileName" placeholder="document.docx" />
            </el-form-item>
          </el-form>

          <el-alert
            v-if="errorMessage"
            title="转换失败"
            type="error"
            :description="errorMessage"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div v-if="progressVisible" class="progress-box mb-4">
            <div class="progress-label">{{ progressMessage }}</div>
            <el-progress :percentage="progressPercent" :stroke-width="14" />
          </div>

          <div class="convert-panel">
            <div class="convert-hint">
              首次转换会从 CDN 加载约数 MB 的依赖；之后同一会话内会复用已加载模块。
            </div>
            <el-button
              type="primary"
              size="large"
              :loading="converting"
              :disabled="!markdown.trim()"
              @click="convert"
            >
              <el-icon style="margin-right:4px"><Download /></el-icon>
              {{ converting ? '正在生成 Word...' : '转换并下载 Word' }}
            </el-button>
          </div>

          <div class="feature-list">
            <span>标题</span>
            <span>段落</span>
            <span>表格</span>
            <span>列表</span>
            <span>引用</span>
            <span>代码块</span>
            <span>链接</span>
            <span>粗体/斜体</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CopyDocument, Document, Download, Select, Upload,
} from '@element-plus/icons-vue'
import { markdownToWordBlob, getMarkdownWordState } from '../utils/markdownWord/markdownToWord'
import type { MarkdownWordLoadState } from '../utils/markdownWord/markdownToWord'
import { useContentCache } from '../utils/contentCache'
import { captureScroll, preserveScroll } from '../utils/scrollPreserve'

const defaultMarkdown = `# Markdown 转 Word

这是一段 **Markdown** 示例。点击转换后会生成可编辑的 Word 文档。

## 支持内容

- 标题和段落
- 有序 / 无序列表
- 表格、引用、代码块
- 链接和常见行内样式

| 字段 | 说明 |
| --- | --- |
| 输入 | Markdown |
| 输出 | .docx |

> 转换过程在浏览器本地完成。

\`\`\`ts
const file = 'document.docx'
\`\`\`
`

const { content: markdown, save: saveMarkdown } = useContentCache('markdown-to-word-content', defaultMarkdown)
const fileName = ref('document.docx')
const converting = ref(false)
const loadState = ref<MarkdownWordLoadState>(getMarkdownWordState())
const progressPercent = ref(0)
const progressMessage = ref('')
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement>()
const markdownInputRef = ref()

const statusTag = computed(() => {
  switch (loadState.value) {
    case 'ready': return { type: 'success' as const, text: '核心已就绪' }
    case 'loading': return { type: 'warning' as const, text: '加载中' }
    case 'error': return { type: 'danger' as const, text: '加载失败' }
    default: return { type: 'info' as const, text: '按需加载' }
  }
})

const progressVisible = computed(() => converting.value || progressPercent.value > 0)

function onMarkdownInput(val: string) {
  preserveScroll(markdownInputRef, () => { markdown.value = val })
}

function pickFile() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  markdown.value = await file.text()
  fileName.value = file.name.replace(/\.(md|markdown)$/i, '.docx')
  input.value = ''
  ElMessage.success('Markdown 文件已导入')
}

function handleSave() {
  saveMarkdown()
  ElMessage.success('已保存到浏览器')
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(markdown.value)
    ElMessage.success('内容已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

async function convert() {
  if (!markdown.value.trim()) {
    ElMessage.warning('请先输入 Markdown 内容')
    return
  }

  converting.value = true
  errorMessage.value = ''
  progressPercent.value = 5
  progressMessage.value = '准备转换...'
  loadState.value = getMarkdownWordState()

  try {
    const blob = await markdownToWordBlob(
      markdown.value,
      {
        fileName: normalizeDocxName(fileName.value),
      },
      (state) => {
        loadState.value = state.state
        progressPercent.value = state.percent
        progressMessage.value = state.message
      },
    )
    downloadBlob(blob, normalizeDocxName(fileName.value))
    ElMessage.success('Word 文档已生成')
  } catch (error) {
    loadState.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    converting.value = false
  }
}

function normalizeDocxName(name: string): string {
  const trimmed = name.trim() || 'document.docx'
  return trimmed.toLowerCase().endsWith('.docx') ? trimmed : `${trimmed}.docx`
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.markdown-word-shell {
  min-height: 0;
}
.markdown-word-area {
  flex: 1;
  min-height: 0;
}
.inline-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 6px;
}
.inline-panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.convert-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.convert-hint {
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}
.progress-box {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
}
.progress-label {
  margin-bottom: 8px;
  font-size: 12px;
  color: #4b5563;
}
.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.feature-list span {
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 12px;
}
@media (max-width: 767px) {
  .convert-panel .el-button {
    width: 100%;
  }
}
</style>
