<template>
  <div class="tool-shell unified-shell">
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><Document /></el-icon>
            压缩/解压工具
            <el-popover placement="right" :width="280" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">ZIP 文件压缩与解压，支持多文件拖拽打包、进度显示、常见归档格式解压。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">注意事项</div>
                  <div class="info-text">压缩仅支持 ZIP 格式。解压支持 zip/rar/7z/tar/gz/xz/bz2。需浏览器支持 WebAssembly。</div>
                </div>
              </div>
            </el-popover>
          </h2>
        </div>
      </div>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="压缩文件" name="compress">
        <div class="operation-area">
          <el-upload
            class="upload-demo"
            drag
            multiple
            :auto-upload="false"
            :on-change="handleCompressChange"
            :on-remove="handleCompressRemove"
            :file-list="compressFiles"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击选择文件</em>
            </div>
          </el-upload>

          <div v-if="compressFiles.length > 0" class="action-bar">
            <el-input v-model="zipFileName" placeholder="输入压缩包名 (默认: archive.zip)" style="width: 260px; margin-right: 12px;" />
            <el-button type="primary" :loading="isCompressing" @click="doCompress">压缩并下载</el-button>
          </div>

          <el-progress
            v-if="compressProgress > 0"
            :percentage="compressProgress"
            :text-inside="true"
            :stroke-width="18"
            status="success"
            class="mt-4"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="解压文件" name="decompress">
        <div class="operation-area">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleDecompressChange"
            :file-list="singleZipFile"
            :limit="1"
            :accept="decompressAccept"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽压缩文件到此处，或 <em>点击选择压缩文件</em>
            </div>
          </el-upload>

          <div v-if="singleZipFile.length > 0" class="action-bar">
            <el-button type="primary" :loading="isDecompressing" @click="doDecompress">提取内容</el-button>
          </div>

          <el-progress
            v-if="decompressProgress > 0"
            :percentage="decompressProgress"
            :text-inside="true"
            :stroke-width="18"
            status="warning"
            class="mt-4"
          />

          <div v-if="unzippedFiles.length > 0" class="file-list mt-4">
            <h4>包含的文件:</h4>
            <el-table :data="unzippedFiles" border style="width: 100%">
              <el-table-column prop="name" label="文件名" />
              <el-table-column prop="size" label="大小 (Bytes)" width="150" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { saveAs } from 'file-saver'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ARCHIVE_EXTENSIONS, decompressArchive } from '../utils/archive/libarchive'
import { compressZip, decompressZip } from '../utils/archive/zip'

const activeTab = ref('compress')

const decompressAccept = computed(() => ARCHIVE_EXTENSIONS.join(','))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileListItem = any

// Compress state
const compressFiles = ref<FileListItem[]>([])
const zipFileName = ref('')
const isCompressing = ref(false)
const compressProgress = ref(0)

// Decompress state
const singleZipFile = ref<FileListItem[]>([])
const isDecompressing = ref(false)
const decompressProgress = ref(0)
const unzippedFiles = ref<FileListItem[]>([])

const handleCompressChange = (_file: FileListItem, fileList: FileListItem[]) => {
  compressFiles.value = fileList
}

const handleCompressRemove = (_file: FileListItem, fileList: FileListItem[]) => {
  compressFiles.value = fileList
}

const doCompress = async () => {
  if (compressFiles.value.length === 0) return

  isCompressing.value = true
  compressProgress.value = 0

  try {
    const content = await compressZip(
      compressFiles.value,
      (percent) => { compressProgress.value = percent }
    )

    let name = zipFileName.value.trim() || 'archive'
    if (!name.endsWith('.zip')) {
      name += '.zip'
    }

    saveAs(content, name)
    ElMessage.success('压缩完成并已下载！')
  } catch (error) {
    console.error(error)
    ElMessage.error('压缩过程中出现错误')
  } finally {
    isCompressing.value = false
    setTimeout(() => { compressProgress.value = 0 }, 3000)
  }
}

const handleDecompressChange = (_file: FileListItem, fileList: FileListItem[]) => {
  singleZipFile.value = fileList.slice(-1)
  unzippedFiles.value = []
  decompressProgress.value = 0
}

const doDecompress = async () => {
  if (singleZipFile.value.length === 0) return

  isDecompressing.value = true
  decompressProgress.value = 0
  unzippedFiles.value = []

  try {
    const file = singleZipFile.value[0].raw
    const filesData = file.name.toLowerCase().endsWith('.zip')
      ? await decompressZip(file, (percent) => { decompressProgress.value = percent })
      : await decompressArchive(file, (percent) => { decompressProgress.value = percent })

    unzippedFiles.value = filesData
    ElMessage.success('解压准备完成！您可以下载单个文件了。')
  } catch (error) {
    console.error(error)
    ElMessage.error('解压过程中出现错误，请确认是否为正确的压缩文件')
  } finally {
    isDecompressing.value = false
  }
}

const downloadFile = (fileObj: { name: string; data: Uint8Array }) => {
  const blob = new Blob([new Uint8Array(fileObj.data)])
  saveAs(blob, fileObj.name.split('/').pop() || fileObj.name)
}
</script>

<style scoped>
.file-list {
  margin-top: 18px;
}
.file-list h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
}

.el-upload__text {
  font-size: 14px;
  color: #6b7280;
}

.el-icon--upload {
  font-size: 28px;
  color: #5b73e0;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
}
:deep(.el-tabs__item.is-active) {
  color: #5b73e0;
}
:deep(.el-tabs__active-bar) {
  background-color: #5b73e0;
}
</style>
