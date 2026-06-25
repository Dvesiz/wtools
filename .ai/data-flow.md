# Data Flow & State Management

## 1. Editor Content Caching (`contentCache.ts`)
**Dual-tier strategy** — avoids IME conflicts from frequent localStorage writes:

```
User types in editor
    │
    ▼
memoryCache.set(key, value)     ◄── on every keystroke (via watch)
    │
    ├── route switch → read from memoryCache (instant, no localStorage)
    ├── 2-minute timer → flushMemoryCache() → localStorage
    └── beforeunload → flushMemoryCache() → localStorage
```

Key functions:
- `useContentCache(key, default)` → `{ content, isRestored, clear, save }` composable
- `getCache(key)` → memory first, localStorage fallback (warms memory)
- `setCache(key, value)` → memory + localStorage immediate
- `flushMemoryCache()` → bulk sync memory→localStorage (timer + beforeunload)

Cache key prefix: `wtools-editor-*`

## 2. Pyodide Python Runner (`pyodideManager.ts`)
**3-Phase initialization + fetch interception:**

```
Phase 1: Pre-download
    for each file in PRELOAD_FILES (pyodide.asm.js, .wasm, pyodide-lock.json, python_stdlib.zip):
        streamDownload(url) → compressUint8Array (DEFLATE) → idbSet (IndexedDB)

Phase 2: Init
    loadFileMap() → decompress all from IDB → fileMap (Map<string, Uint8Array>)
    setFetchInterceptor() → intercepts window.fetch:
        if filename in fileMap → serve from cache
        else → redirect to CDN (core or libs)
    loadScript(pyodide.js from CDN) → window.loadPyodide({ indexURL: CDN })

Phase 3: Execution
    runPythonCode(code):
        extractImports(code) → regex (import X / from X)
        PACKAGE_NAME_MAP → resolve package names (numpy, pandas, opencv-python, etc.)
        ensurePackages() → pyodide.loadPackage() for missing ones
        exec() in wrapped stdout/stderr redirect → return stdout + stderr (ANSI)
```

## 3. Cross-Tool Communication
```
Tool A saves data via sessionStorage.setItem('wtools-share-*', ...)
Tool B reads via sessionStorage.getItem('wtools-share-*')
```
Only ListTreeVisualizer uses this: exports as JSON for TreeVisualizer.

## 4. Route Lifecycle
```
Route change → <router-view> unmounts old, mounts new
    - Old component destroyed (refs gone)
    - Memory cache survives (Map in module scope)
    - New component calls useContentCache(key) → gets memory cache instantly
```

## 5. Scroll Preservation (`scrollPreserve.ts`)
Prevents textarea scroll jumping on Vue reactivity:
- `captureScroll(e)` → save scrollTop on @scroll
- `preserveScroll(ref, updater)` → call updater, then nextTick restore scrollTop
- Used by ZipTool for file name editing

## Key Module Imports Graph
```
main.ts
  ├── App.vue
  │   ├── router/index.ts → lazy loads views
  │   └── views/*.vue → components/*.vue
  │       └── JavaToTs.vue       (uses no util)
  │       ├── ZipTool.vue        → archive/{zip,libarchive}.ts
  │       ├── TreeVisualizer.vue → utils/contentCache.ts
  │       ├── ListTreeVisualizer.vue → utils/{contentCache,fileIcons}.ts
  │       └── PythonRunner.vue   → utils/{contentCache,ansiToHtml,pyodide/*}.ts
  └── utils/contentCache.ts      (module-level Map, no deps)
```
