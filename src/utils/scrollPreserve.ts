import { nextTick } from 'vue'

/**
 * scrollPreserve — 防止 textarea 在响应式更新时滚动条跳到顶部
 *
 * Element Plus 的 el-input[type="textarea"] 在内层使用原生 <textarea>。
 * 响应式更新后 textarea DOM 可能被替换，导致 scrollTop 丢失。
 *
 * 用法：
 *   1. 将 v-model 拆为 :model-value + @input
 *   2. 在 @scroll 上调用 captureScroll()
 *   3. 在 @input 中用 preserveScroll() 包裹赋值操作
 */

let savedScrollTop = 0

/** 保存当前滚动位置，绑定到 @scroll */
export function captureScroll(e: Event) {
  savedScrollTop = (e.target as HTMLElement).scrollTop
}

/**
 * 更新 ref 值后恢复 textarea 的滚动位置。
 * @param inputRef  el-input 的 template ref
 * @param updater   更新 ref 的回调
 */
export function preserveScroll(
  inputRef: { value: { textarea?: HTMLTextAreaElement } | null },
  updater: () => void,
) {
  updater()
  nextTick(() => {
    const ta = inputRef.value?.textarea
    if (ta) {
      ta.scrollTop = savedScrollTop
    }
  })
}

