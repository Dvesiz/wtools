/** File-type recognition and category icons for tree list visualization */

export type FileCategory =
  | 'image'
  | 'doc'
  | 'code'
  | 'data'
  | 'archive'
  | 'media'
  | 'config'
  | 'web'
  | 'text'

// ─── Extension → category mapping ────────────────────────────────
const EXT_MAP: Record<string, FileCategory> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image',
  svg: 'image', webp: 'image', ico: 'image', bmp: 'image',
  pdf: 'doc', doc: 'doc', docx: 'doc', xls: 'doc', xlsx: 'doc',
  ppt: 'doc', pptx: 'doc',
  py: 'code', js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  java: 'code', kt: 'code', scala: 'code',
  cpp: 'code', c: 'code', h: 'code', hpp: 'code',
  go: 'code', rs: 'code', rb: 'code', php: 'code',
  swift: 'code', vue: 'code', cs: 'code',
  sh: 'code', bash: 'code', zsh: 'code',
  zip: 'archive', rar: 'archive', '7z': 'archive',
  tar: 'archive', gz: 'archive', bz2: 'archive', tgz: 'archive',
  csv: 'data', db: 'data', sqlite: 'data', sql: 'data',
  json: 'data', xml: 'data',
  yaml: 'config', yml: 'config', toml: 'config',
  ini: 'config', cfg: 'config', conf: 'config', env: 'config',
  mp4: 'media', avi: 'media', mkv: 'media', mov: 'media', webm: 'media',
  mp3: 'media', wav: 'media', flac: 'media', ogg: 'media',
  html: 'web', htm: 'web', css: 'web', scss: 'web', less: 'web',
  txt: 'text', md: 'text', rst: 'text', log: 'text',
}

export function getFileCategory(name: string): FileCategory {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot >= name.length - 1) return 'doc'
  return EXT_MAP[name.substring(dot + 1).toLowerCase()] ?? 'doc'
}

// ─── SVG templates (16×16 viewBox, category-colored) ─────────────
// Each icon is kept to ≤3 primitives for crisp rendering at 16px.

/** Image — frame + sun ellipse + mountain */
const IMAGE_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<rect x="1" y="2" width="14" height="12" rx="2" fill="#fff7ed" stroke="#f59e0b" stroke-width="1.2"/>',
  '<ellipse cx="11" cy="4.5" rx="3.5" ry="2" fill="#f59e0b" opacity="0.5"/>',
  '<path d="M1 13.5 L5 7 L9 13.5 Z" fill="#f59e0b" opacity="0.3"/>',
  '</svg>',
].join('')

/** Doc — page with fold */
const DOC_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M3 1.5 L10 1.5 L13 4.5 L13 14 L3 14 Z" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.1"/>',
  '<path d="M10 1.5 L13 4.5 L10 4.5 Z" fill="#3b82f6" opacity="0.2"/>',
  '<line x1="5" y1="7.5" x2="11" y2="7.5" stroke="#3b82f6" stroke-width="1" opacity="0.3" stroke-linecap="round"/>',
  '<line x1="5" y1="10" x2="11" y2="10" stroke="#3b82f6" stroke-width="1" opacity="0.3" stroke-linecap="round"/>',
  '<line x1="5" y1="12.5" x2="9" y2="12.5" stroke="#3b82f6" stroke-width="1" opacity="0.3" stroke-linecap="round"/>',
  '</svg>',
].join('')

/** Code — page with angle brackets */
const CODE_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M3 1.5 L10 1.5 L13 4.5 L13 14 L3 14 Z" fill="#d1fae5" stroke="#10b981" stroke-width="1.1"/>',
  '<path d="M10 1.5 L13 4.5 L10 4.5 Z" fill="#10b981" opacity="0.2"/>',
  '<path d="M5.5 8 L4 9.5 L5.5 11" stroke="#10b981" stroke-width="1.2" stroke-linecap="round" fill="none"/>',
  '<path d="M9.5 8 L11 9.5 L9.5 11" stroke="#10b981" stroke-width="1.2" stroke-linecap="round" fill="none"/>',
  '</svg>',
].join('')

/** Data — database cylinder (single continuous outline + partition line) */
const DATA_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M2.5 4 A5.5 2 0 0 0 13.5 4 L13.5 12 A5.5 2 0 0 1 2.5 12 Z" fill="#ffedd5" stroke="#f97316" stroke-width="1.1"/>',
  '<ellipse cx="8" cy="4" rx="5.5" ry="2" fill="#fff7ed" stroke="#f97316" stroke-width="1.1"/>',
  '<line x1="2.5" y1="7.5" x2="13.5" y2="7.5" stroke="#f97316" stroke-width="0.7" opacity="0.25"/>',
  '</svg>',
].join('')

/** Archive — box + lid tab + zipper arrow */
const ARCHIVE_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M1.5 4.5 L4 2 L12 2 L14.5 4.5" fill="#f3e8ff" stroke="#8b5cf6" stroke-width="1.1" stroke-linejoin="round"/>',
  '<rect x="2" y="4.5" width="12" height="9" rx="1" fill="#f3e8ff" stroke="#8b5cf6" stroke-width="1.1"/>',
  '<path d="M5 6 L5 8 L8 8" stroke="#8b5cf6" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  '</svg>',
].join('')

/** Media — rounded rect + play triangle */
const MEDIA_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="#fce7f3" stroke="#ec4899" stroke-width="1.1"/>',
  '<path d="M6 5.5 L10.5 8 L6 10.5 Z" fill="#ec4899" opacity="0.55"/>',
  '</svg>',
].join('')

/** Config — circle + radial spokes */
const CONFIG_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<circle cx="8" cy="8" r="3.2" fill="#f3f4f6" stroke="#6b7280" stroke-width="1.1"/>',
  '<path d="M8 2 L8 4.5 M8 11.5 L8 14 M2 8 L4.5 8 M11.5 8 L14 8 M3.5 3.5 L5.3 5.3 M10.7 10.7 L12.5 12.5 M3.5 12.5 L5.3 10.7 M10.7 5.3 L12.5 3.5" stroke="#6b7280" stroke-width="1.1" stroke-linecap="round" opacity="0.45"/>',
  '</svg>',
].join('')

/** Web — document with globe */
const WEB_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M3 1.5 L10 1.5 L13 4.5 L13 14 L3 14 Z" fill="#cffafe" stroke="#06b6d4" stroke-width="1.1"/>',
  '<path d="M10 1.5 L13 4.5 L10 4.5 Z" fill="#06b6d4" opacity="0.2"/>',
  '<circle cx="5.5" cy="9.5" r="2.5" stroke="#06b6d4" stroke-width="1" fill="none"/>',
  '<line x1="3.2" y1="9.5" x2="7.8" y2="9.5" stroke="#06b6d4" stroke-width="1" opacity="0.5"/>',
  '<path d="M5.5 7 C6.5 8.5 6.5 10.5 5.5 12" stroke="#06b6d4" stroke-width="1" fill="none" opacity="0.5"/>',
  '</svg>',
].join('')

/** Text — page with text lines (similar to doc but slate-colored) */
const TEXT_SVG = [
  '<svg viewBox="0 0 16 16" fill="none">',
  '<path d="M3 1.5 L10 1.5 L13 4.5 L13 14 L3 14 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.1"/>',
  '<path d="M10 1.5 L13 4.5 L10 4.5 Z" fill="#94a3b8" opacity="0.2"/>',
  '<line x1="5" y1="7.5" x2="11" y2="7.5" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>',
  '<line x1="5" y1="10" x2="11" y2="10" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>',
  '<line x1="5" y1="12.5" x2="9" y2="12.5" stroke="#94a3b8" stroke-width="1" opacity="0.4" stroke-linecap="round"/>',
  '</svg>',
].join('')

const SVG_MAP: Record<FileCategory, string> = {
  image: IMAGE_SVG,
  doc: DOC_SVG,
  code: CODE_SVG,
  data: DATA_SVG,
  archive: ARCHIVE_SVG,
  media: MEDIA_SVG,
  config: CONFIG_SVG,
  web: WEB_SVG,
  text: TEXT_SVG,
}

export function getFileIconSVG(name: string): string {
  return SVG_MAP[getFileCategory(name)]
}
