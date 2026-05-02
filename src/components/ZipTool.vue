<template>
  <div class="tool-shell">
    <h2>压缩/解压工具</h2>
    <p class="subtitle">压缩仅支持 ZIP，解压支持常见格式（zip/rar/7z/tar/gz/xz/bz2）。</p>
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

          <div class="action-bar" v-if="compressFiles.length > 0">
            <el-input v-model="zipFileName" placeholder="输入压缩包名 (默认: archive.zip)" style="width: 260px; margin-right: 12px;"></el-input>
            <el-button type="primary" @click="doCompress" :loading="isCompressing">压缩并下载</el-button>
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

          <div class="action-bar" v-if="singleZipFile.length > 0">
            <el-button type="primary" @click="doDecompress" :loading="isDecompressing">提取内容</el-button>
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
import { ARCHIVE_EXTENSIONS, decompressArchive } from '../tools/archive/libarchive'
import { compressZip, decompressZip } from '../tools/archive/zip'

const activeTab = ref('compress')

const decompressAccept = computed(() => ARCHIVE_EXTENSIONS.join(','))

// Compress state
const compressFiles = ref<any[]>([])
const zipFileName = ref('')
const isCompressing = ref(false)
const compressProgress = ref(0)

// Decompress state
const singleZipFile = ref<any[]>([])
const isDecompressing = ref(false)
const decompressProgress = ref(0)
const unzippedFiles = ref<any[]>([])

const handleCompressChange = (_file: any, fileList: any[]) => {
  compressFiles.value = fileList
}

const handleCompressRemove = (_file: any, fileList: any[]) => {
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

const handleDecompressChange = (_file: any, fileList: any[]) => {
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

const downloadFile = (fileObj: any) => {
  const blob = new Blob([fileObj.data])
  saveAs(blob, fileObj.name.split('/').pop() || fileObj.name)
}
</script>

<style scoped>
.tool-shell {
  width: 100%;
  max-width: 860px;
  padding: 20px;
  border: 1px solid #e6e8eb;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.subtitle {
  margin: 6px 0 18px;
  color: #6b7280;
  font-size: 13px;
}

.operation-area {
  margin-top: 12px;
  padding: 14px;
  background: #fafafa;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.action-bar {
  margin-top: 14px;
  display: flex;
  align-items: center;
}

.file-list {
  margin-top: 18px;
}

.el-upload__text {
  font-size: 14px;
  color: #6b7280;
}

.el-icon--upload {
  font-size: 28px;
  color: #409eff;
}

.mt-4 {
  margin-top: 16px;
}
</style>
