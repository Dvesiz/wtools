import { compressUint8Array, decompressUint8Array } from '../archive/zip'
import { CORE_CDN, LIBS_CDN, PRELOAD_FILES } from './config'

// ──────────────────────────────────────────
//  类型定义
// ──────────────────────────────────────────

export type StepName = 'download' | 'init' | 'ready'

export interface StepState {
  name: StepName
  label: string
  status: 'pending' | 'active' | 'done' | 'skipped' | 'error'
  percent: number
  message: string
}

// ──────────────────────────────────────────
//  IndexedDB 工具函数
// ──────────────────────────────────────────

const DB_NAME = 'pyodide-cache-v3'
const STORE_NAME = 'files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, data: Uint8Array): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, key)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

function idbGetAllEntries(): Promise<[string, Uint8Array][]> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).openCursor()
      const entries: [string, Uint8Array][] = []
  
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          entries.push([cursor.key as string, cursor.value as Uint8Array])
          cursor.continue()
        } else {
          db.close()
          resolve(entries)
        }
      }
      req.onerror = () => { db.close(); reject(req.error) }
    }).catch(reject)
  })
}

export async function clearCache(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// ──────────────────────────────────────────
//  步骤 1：流式下载单个文件
// ──────────────────────────────────────────

export async function streamDownload(
  url: string,
  onProgress: (bytes: number) => void
): Promise<Uint8Array> {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`下载失败 (HTTP ${response.status})`)
  }
  if (!response.body) {
    throw new Error('下载失败：响应无流式内容')
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(received)
  }

  const combined = new Uint8Array(received)
  let pos = 0
  for (const chunk of chunks) {
    combined.set(chunk, pos)
    pos += chunk.length
  }
  return combined
}

// ──────────────────────────────────────────
//  步骤 2：从 CDN 逐文件下载并缓存
// ──────────────────────────────────────────

/**
 * 逐个下载 PRELOAD_FILES 中的文件，下载完立即缓存。
 *
 * @param onFileProgress  - (name, bytes) 当前文件已下载字节数
 * @param onFileDone      - (name, index, total) 一个文件完成
 */
export async function downloadAndCacheFiles(
  onFileProgress: (name: string, bytes: number) => void,
  onFileDone: (name: string, index: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < PRELOAD_FILES.length; i++) {
    const name = PRELOAD_FILES[i]
    const url = `${CORE_CDN}${name}`
    const data = await streamDownload(url, (bytes) => {
      onFileProgress(name, bytes)
    })
    // DEFLATE 压缩后存入 IndexedDB（节省 ~50% 空间）
    const compressed = await compressUint8Array(data)
    await idbSet(name, compressed)
    onFileDone(name, i + 1, PRELOAD_FILES.length)
  }
}

// ──────────────────────────────────────────
//  检查缓存
// ──────────────────────────────────────────

/** 检查是否所有预加载文件都已缓存 */
export async function checkCache(): Promise<boolean> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).count()
      req.onsuccess = () => { db.close(); resolve(req.result >= PRELOAD_FILES.length) }
      req.onerror = () => { db.close(); reject(req.error) }
    })
  } catch {
    return false
  }
}

// ──────────────────────────────────────────
//  Fetch 拦截器 – 缓存优先 → CDN 回退
// ──────────────────────────────────────────

let fileMap: Map<string, Uint8Array> | null = null

function isLibFile(name: string): boolean {
  return (
    name.endsWith('.zip') ||
    name.endsWith('.so') ||
    name.endsWith('.whl') ||
    name.endsWith('.data') ||
    /^[a-z_]+\.cpython-\d+-\w+\.so$/i.test(name)
  )
}

function getMime(name: string): string {
  if (name.endsWith('.wasm')) return 'application/wasm'
  if (name.endsWith('.zip')) return 'application/zip'
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'application/javascript'
  return 'application/octet-stream'
}

async function loadFileMap(): Promise<void> {
  if (fileMap) return
  fileMap = new Map()
  const entries = await idbGetAllEntries()
  for (const [key, val] of entries) {
    // IDB 中存的是压缩过的 zip，解压后放回 fileMap
    const data = await decompressUint8Array(val)
    fileMap.set(key, data)
  }
}

export function setFetchInterceptor(): () => void {
  const original = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const url = (typeof input === 'string' ? input : input instanceof Request ? input.url : String(input))
    const filename = url.split('/').pop() || ''

    // 缓存命中 → 直接返回
    if (filename && fileMap?.has(filename)) {
      return new Response(fileMap.get(filename)! as BodyInit, {
        headers: { 'Content-Type': getMime(filename) },
      })
    }

    // 未命中 → 按类型分流到对应 CDN
    if (filename) {
      const base = isLibFile(filename) ? LIBS_CDN : CORE_CDN
      return original(`${base}${filename}`, init)
    }

    return original(input, init)
  }

  return () => {
    window.fetch = original
  }
}

// ──────────────────────────────────────────
//  初始化 Pyodide
// ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Pyodide runtime has no types
let pyodideInstance: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Pyodide runtime has no types
export function getPyodide(): any {
  return pyodideInstance
}

export async function initPyodide(
  onStep: (percent: number, message: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Pyodide runtime has no types
): Promise<any> {
  if (pyodideInstance) return pyodideInstance

  // 1) 从 IndexedDB 加载文件索引到内存
  onStep(20, '加载缓存文件索引...')
  await loadFileMap()

  // 2) 激活 fetch 拦截器
  onStep(40, '设置文件拦截器...')
  const cleanup = setFetchInterceptor()

  try {
    // 3) 通过 script 标签加载 Pyodide
    onStep(60, '加载 Pyodide 运行时...')
    await loadScript(`${CORE_CDN}pyodide.js`)

    // 4) 初始化 Python 解释器
    onStep(80, '初始化 Python 解释器...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window.loadPyodide injected by external script
    pyodideInstance = await (window as any).loadPyodide({
      indexURL: CORE_CDN,
    })

    onStep(100, 'Python 解释器已就绪')
    return pyodideInstance
  } catch (e) {
    cleanup()
    throw e
  }
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`脚本加载失败: ${url}`))
    document.head.appendChild(script)
  })
}

// ──────────────────────────────────────────
//  运行 Python 代码（含自动导包）
// ──────────────────────────────────────────

import { PACKAGE_NAME_MAP } from './package-name-map.ts'

const loadedPackages = new Set<string>(['micropip'])
const loadingPromises = new Map<string, Promise<void>>()

/** 从 Python 源码提取 import / from ... import 的顶层模块名 */
function extractImports(code: string): string[] {
  const imports = new Set<string>()
  const patterns = [
    /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm,
    /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(code)) !== null) {
      imports.add(match[1])
    }
  }
  return Array.from(imports)
}

/** 加载单个 Python 包 */
async function loadPackage(pkg: string, onMessage?: (msg: string) => void): Promise<void> {
  if (loadingPromises.has(pkg)) return loadingPromises.get(pkg)

  const promise = (async () => {
    onMessage?.(`正在加载 ${pkg}...`)
    try {
      await pyodideInstance!.loadPackage(pkg)
      loadedPackages.add(pkg)
      onMessage?.(`✓ ${pkg} 已完成`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- catch unknown error type
    } catch (err: any) {
      onMessage?.(`✗ ${pkg} 加载失败: ${err.message}`)
      throw err
    }
  })()

  loadingPromises.set(pkg, promise)
  return promise
}

/** 扫描代码中未加载的 import 并自动加载 */
async function ensurePackages(code: string, onMessage?: (msg: string) => void): Promise<void> {
  if (!pyodideInstance) return
  const imports = extractImports(code)
  const missing: string[] = []

  for (const imp of imports) {
    const mapped = PACKAGE_NAME_MAP[imp]
    if (mapped === null) continue // Python 内置模块，跳过
    const pkg = mapped ?? imp      // 有映射用映射，否则假定 import 名 = 包名
    if (!loadedPackages.has(pkg)) missing.push(pkg)
  }

  if (missing.length === 0) return

  onMessage?.(`自动加载依赖: ${missing.join(', ')}`)
  await Promise.all(missing.map((pkg) => loadPackage(pkg, onMessage)))
}

export async function runPythonCode(
  code: string,
  onPackage?: (msg: string) => void,
): Promise<string> {
  if (!pyodideInstance) {
    throw new Error('Pyodide 尚未初始化')
  }

  // 自动检测并加载缺失的包
  await ensurePackages(code, onPackage)

  pyodideInstance.globals.set('__code_json__', JSON.stringify(code))

  const wrapped = `
import sys, json, io
_code = json.loads(__code_json__)
_stdout = io.StringIO()
_stderr = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _stdout, _stderr
_exc = None
try:
    exec(_code)
except BaseException as _e:
    import traceback
    _stderr.write("Traceback (most recent call last):\\n")
    traceback.print_exc(file=_stderr)
finally:
    sys.stdout, sys.stderr = _old_out, _old_err
__py_out__ = _stdout.getvalue()
__py_err__ = _stderr.getvalue()
  `

  try {
    pyodideInstance.runPython(wrapped)
    const output = pyodideInstance.globals.get('__py_out__') || ''
    const error = pyodideInstance.globals.get('__py_err__') || ''
    return output + (error ? `\n\x1b[31m${error}\x1b[0m` : '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- catch unknown error type
  } catch (e: any) {
    return `\n[运行时错误] ${e.message || e}`
  }
}

// ──────────────────────────────────────────
//  默认示例代码
// ──────────────────────────────────────────

export const DEFAULT_CODE = `print("Hello from Python in the browser!")
print(f"1 + 1 = {1 + 1}")

# 列表推导式
squares = [x**2 for x in range(10)]
print(f"Squares: {squares}")

# 使用标准库
import math
print(f"Pi = {math.pi}")
print(f"sin(\u03c0/2) = {math.sin(math.pi / 2)}")

# 字典操作
data = {"name": "Pyodide", "type": "WASM Python", "version": "0.25.0"}
for k, v in data.items():
    print(f"  {k}: {v}")
`

// ──────────────────────────────────────────
//  步骤列表定义（用于 UI 展示）
// ──────────────────────────────────────────

export function createSteps(): StepState[] {
  return [
    { name: 'download', label: '下载 Pyodide 文件', status: 'pending', percent: 0, message: '' },
    { name: 'init', label: '初始化解释器', status: 'pending', percent: 0, message: '' },
    { name: 'ready', label: '就绪', status: 'pending', percent: 0, message: '' },
  ]
}
