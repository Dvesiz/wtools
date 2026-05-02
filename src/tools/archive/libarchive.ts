import type { ArchiveFile } from './zip'

export const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz']

const getEntryName = (entry: any): string =>
  entry.path || entry.pathname || entry.name || entry.filepath || 'unknown'

const isDirectoryEntry = (entry: any): boolean => {
  if (typeof entry.isDirectory === 'function') return entry.isDirectory()
  if (typeof entry.isDirectory === 'boolean') return entry.isDirectory
  if (entry.type === 'directory' || entry.filetype === 'directory') return true
  const name = getEntryName(entry)
  return name.endsWith('/')
}

const readEntryData = async (entry: any): Promise<Uint8Array> => {
  if (typeof entry.readData === 'function') {
    const data = await entry.readData()
    return data instanceof Uint8Array ? data : new Uint8Array(data)
  }
  if (typeof entry.arrayBuffer === 'function') {
    const data = await entry.arrayBuffer()
    return new Uint8Array(data)
  }
  if (typeof entry.read === 'function') {
    const data = await entry.read()
    return data instanceof Uint8Array ? data : new Uint8Array(data)
  }
  throw new Error('Unsupported entry reader')
}

export const decompressArchive = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<ArchiveFile[]> => {
  const module = await import('libarchive.js')
  const Archive = (module as any).Archive || (module as any).default?.Archive || (module as any).default

  if (!Archive || typeof Archive.open !== 'function') {
    throw new Error('libarchive.js API not found')
  }

  const archive = await Archive.open(file)
  let entries: any = archive.getEntries ? await archive.getEntries() : archive.entries?.() || archive
  const isIterable = entries && typeof entries[Symbol.asyncIterator] === 'function'
  const list = isIterable ? [] : entries
  const total = Array.isArray(list) ? list.length : undefined

  const files: ArchiveFile[] = []
  let processed = 0

  try {
    if (isIterable) {
      for await (const entry of entries) {
        if (isDirectoryEntry(entry)) {
          continue
        }
        const data = await readEntryData(entry)
        files.push({
          name: getEntryName(entry),
          size: data.length,
          data
        })
        processed++
        if (total) {
          onProgress?.(Math.floor((processed / total) * 100))
        }
      }
    } else {
      for (const entry of list) {
        if (isDirectoryEntry(entry)) {
          continue
        }
        const data = await readEntryData(entry)
        files.push({
          name: getEntryName(entry),
          size: data.length,
          data
        })
        processed++
        if (total) {
          onProgress?.(Math.floor((processed / total) * 100))
        }
      }
    }
  } finally {
    if (typeof archive.close === 'function') {
      archive.close()
    }
    onProgress?.(100)
  }

  return files
}

