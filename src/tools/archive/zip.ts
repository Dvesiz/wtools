export type ArchiveFile = {
  name: string
  size: number
  data: Uint8Array
}

export const compressZip = async (
  files: { raw: File }[],
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  files.forEach(fileItem => {
    const file = fileItem.raw
    zip.file(file.name, file)
  })

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

