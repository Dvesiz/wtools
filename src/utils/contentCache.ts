import { ref, watch, type Ref } from 'vue'

/**
 * contentCache — 编辑器内容缓存模块
 *
 * 双缓存策略:
 *   - 内存 Map: 切换工具时零延迟恢复
 *   - localStorage: 定时批量化持久化（每 2 分钟 + 页面关闭前）
 *
 * 不再每次输入都写 localStorage，避免与输入法自动补全冲突。
 * 手动点击「保存」按钮可立即持久化。
 */

const CACHE_PREFIX = 'wtools-editor-'

// ── Memory cache (in-process, survives route switches) ──
const memoryCache = new Map<string, string>()

// ── Low-level API ──

export function getCache(key: string): string | null {
  // Memory first (fast path)
  if (memoryCache.has(key)) return memoryCache.get(key)!

  // Fall back to localStorage → warm memory
  const raw = localStorage.getItem(CACHE_PREFIX + key)
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string') {
        memoryCache.set(key, parsed)
        return parsed
      }
    } catch {
      // corrupt data → discard
      localStorage.removeItem(CACHE_PREFIX + key)
    }
  }
  return null
}

export function setCache(key: string, value: string): void {
  memoryCache.set(key, value)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    // Quota exceeded - memory cache still works this session
  }
}

export function clearCache(key: string): void {
  memoryCache.delete(key)
  localStorage.removeItem(CACHE_PREFIX + key)
}

/**
 * 将当前内存缓存全部刷入 localStorage。
 * 由定时器或页面关闭前调用，避免每次输入都写磁盘。
 */
export function flushMemoryCache(): void {
  for (const [key, value] of memoryCache.entries()) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
      // Quota exceeded — memory cache still works this session
    }
  }
}

// ── Composable (auto‑persist a ref) ──

export interface UseContentCacheReturn {
  /** The auto‑persisting ref. Bind it with v-model or use directly. */
  content: Ref<string>
  /** True when cached content was restored (from memory or localStorage). */
  isRestored: boolean
  /** Reset content to defaultValue and clear cache. */
  clear: () => void
  /** Immediately persist current content to cache (memory + localStorage). */
  save: () => void
}

/**
 * Creates a `ref<string>` that preserves to memory on every change,
 * and persists to localStorage on explicit save() or global timer.
 *
 * @param key          Unique cache key (e.g. `'python-code'`).
 * @param defaultValue Fallback value when no cache exists.
 */
export function useContentCache(key: string, defaultValue: string): UseContentCacheReturn {
  const cached = getCache(key)
  const isRestored = cached !== null
  const content = ref(cached ?? defaultValue)

  // Only write to memory cache on change (fast, no IME conflict)
  watch(content, (val) => {
    memoryCache.set(key, val)
  })

  function clear() {
    content.value = defaultValue
    clearCache(key)
  }

  /** Immediately persist to memory + localStorage */
  function save() {
    setCache(key, content.value)
  }

  return { content, isRestored, clear, save }
}
