/**
 * CM6 编辑器主题扩展
 * 通过 EditorView.theme() 定义，优先级高于 CM6 默认样式，无需 !important。
 */
import { EditorView } from '@codemirror/view'

export const pythonEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
  },

  '.cm-scroller': {
    fontFamily: `'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace`,
    lineHeight: '1.7',
    height: '100%',
    width: '100%',
    outline: 'none',
  },

  '.cm-content': {
    padding: '14px 0',
  },

  '.cm-gutters': {
    borderRight: '1px solid #eef0f5',
  },

  '.cm-activeLineGutter': {
    backgroundColor: '#eef0ff',
  },
})
