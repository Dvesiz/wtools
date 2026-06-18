export type ArchiveFile = {
  name: string
  size: number
  data: Uint8Array
}

export type CompressFile = {
  raw: File
  path?: string
}

// ── 单文件 Uint8Array 压缩 / 解压 ──

/** 用 JSZip DEFLATE 压缩单个 Uint8Array */
export const compressUint8Array = async (data: Uint8Array): Promise<Uint8Array> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file('data', data, { compression: 'DEFLATE' })
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

/** 解压单个 Uint8Array（compressUint8Array 的逆操作） */
export const decompressUint8Array = async (compressed: Uint8Array): Promise<Uint8Array> => {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(compressed)
  return zip.file('data')!.async('uint8array')
}

// ── 多文件压缩 / 解压 ──

export const compressZip = async (
  files: CompressFile[],
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  for (const fileItem of files) {
    const file = fileItem.raw
    if (!file) {
      throw new Error('Missing upload file data')
    }
    zip.file(fileItem.path || file.name, await file.arrayBuffer())
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }, (metadata: { percent: number }) => {
    onProgress?.(Math.floor(metadata.percent))
  })
}

export const decompressZip = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<ArchiveFile[]> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const loadedZip = await zip.loadAsync(file)

  const totalFiles = Object.keys(loadedZip.files).length
  let processed = 0
  const filesData: ArchiveFile[] = []

  for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
    if (!zipEntry.dir) {
      const u8 = await zipEntry.async('uint8array')
      filesData.push({
        name: filename,
        size: u8.length,
        data: u8
      })
    }
    processed++
    onProgress?.(Math.floor((processed / totalFiles) * 100))
  }

  return filesData
}

