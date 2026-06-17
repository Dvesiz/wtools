import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { flushMemoryCache } from './utils/contentCache'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')

// ── Periodic auto-save: flush memory cache to localStorage ──
// 每 2 分钟持久化一次，避免每次输入都写 localStorage 与输入法冲突
setInterval(() => flushMemoryCache(), 120_000)

// 页面关闭前确保数据已持久化
window.addEventListener('beforeunload', () => flushMemoryCache())
