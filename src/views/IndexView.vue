<template>
  <div class="index-page">
    <!-- Hero section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-accent" />
        <h1 class="hero-title">实用前端工具集</h1>
        <p class="hero-subtitle">
          一套纯前端工具箱，所有计算都在浏览器本地完成，无需后端服务。
        </p>
      </div>
    </div>

    <!-- Tool cards grid -->
    <div class="tool-grid">
      <div
        v-for="tool in tools"
        :key="tool.path"
        class="tool-card"
        @click="navigateTo(tool.path)"
      >
        <div class="card-icon-wrapper" :style="{ background: tool.gradient }">
          <el-icon :size="28"><component :is="tool.icon" /></el-icon>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">{{ tool.name }}</h3>
            <span v-if="tool.badge" class="card-badge">{{ tool.badge }}</span>
          </div>
          <p class="card-desc">{{ tool.desc }}</p>
          <div class="card-tags">
            <span v-for="tag in tool.tags" :key="tag" class="card-tag">{{ tag }}</span>
          </div>
        </div>
        <div class="card-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  DataAnalysis, Document, Share, Folder, Monitor,
  ArrowRight,
} from '@element-plus/icons-vue'

const router = useRouter()

interface ToolItem {
  path: string
  name: string
  desc: string
  icon: object
  gradient: string
  tags: string[]
  badge?: string
}

const tools: ToolItem[] = [
  {
    path: '/java-to-ts',
    name: 'Java DTO 转 TypeScript',
    desc: '快速将 Java DTO / VO 代码解析并转换为 TypeScript 接口定义，支持泛型、集合类型映射。',
    icon: DataAnalysis,
    gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
    tags: ['类型映射', '泛型支持', 'FIXME 标记'],
  },
  {
    path: '/zip',
    name: '压缩/解压工具',
    desc: 'ZIP 文件压缩与多格式解压，支持拖拽打包、实时进度反馈，所有操作在浏览器本地完成。',
    icon: Document,
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    tags: ['ZIP 压缩', 'RAR/7z/TAR', '拖拽上传'],
  },
  {
    path: '/tree-visualizer',
    name: '树形结构可视化',
    desc: '将 JSON 数据渲染为可交互的 ECharts 树形结构图，支持自定义字段映射与多种布局配置。',
    icon: Share,
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    tags: ['ECharts', '交互缩放', '4 种布局'],
    badge: 'v1.0',
  },
  {
    path: '/list-tree',
    name: '树列表可视化',
    desc: '将 ├─ └─ 制表符绘制的树形文本渲染为可折叠的 D3 列表视图，支持文件图标和内联注释。',
    icon: Folder,
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    tags: ['D3.js', '文件图标', 'JSON 导出'],
  },
  {
    path: '/python-runner',
    name: 'Python 在线运行',
    desc: '基于 Pyodide WASM 的浏览器端 Python 解释器，支持标准库和第三方库按需加载。',
    icon: Monitor,
    gradient: 'linear-gradient(135deg, #ef4444, #ec4899)',
    tags: ['Pyodide', 'WASM', '离线缓存'],
    badge: 'Pyodide 0.29',
  },
]

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.index-page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 0;
}

/* ── Hero ── */
.hero-section {
  margin-bottom: 32px;
}
.hero-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px;
}
.hero-accent {
  width: 40px;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  margin-bottom: 4px;
}
.hero-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}
.hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

/* ── Grid ── */
.tool-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Card ── */
.tool-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 22px;
  background: #fff;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.2s;
  position: relative;
  overflow: hidden;
}
.tool-card:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 8px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.tool-card:active {
  transform: translateY(0);
}

/* Icon */
.card-icon-wrapper {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* Body */
.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
}
.card-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 8px;
  background: #eef0ff;
  color: #6366f1;
  border: 1px solid #d4dcff;
  line-height: 18px;
  flex-shrink: 0;
}
.card-desc {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.card-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  line-height: 20px;
}

/* Arrow */
.card-arrow {
  flex-shrink: 0;
  color: #d1d5db;
  font-size: 16px;
  transition: color 0.2s, transform 0.2s;
}
.tool-card:hover .card-arrow {
  color: #6366f1;
  transform: translateX(3px);
}

/* ── Responsive ── */
@media (max-width: 767px) {
  .index-page {
    padding: 12px 0;
  }
  .hero-title {
    font-size: 22px;
  }
  .tool-card {
    padding: 14px 16px;
    gap: 14px;
  }
  .card-icon-wrapper {
    width: 44px;
    height: 44px;
  }
  .card-icon-wrapper :deep(.el-icon) {
    font-size: 22px !important;
  }
  .card-title {
    font-size: 14px;
  }
}
</style>
