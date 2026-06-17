<template>
  <div class="app-wrapper">
    <!-- Mobile top bar -->
    <div class="mobile-topbar">
      <el-button class="burger-btn" text @click="drawerOpen = true">
        <el-icon size="20"><Expand /></el-icon>
      </el-button>
      <span class="mobile-title">实用前端工具</span>
    </div>

    <!-- Mobile drawer menu -->
    <el-drawer v-model="drawerOpen" direction="ltr" size="260px" :with-header="false" class="mobile-drawer">
      <div class="drawer-menu">
        <div class="logo">实用前端工具</div>
        <el-menu :default-active="route.path" router @select="drawerOpen = false">
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页总览</span>
          </el-menu-item>
          <el-menu-item index="/java-to-ts">
            <el-icon><DataAnalysis /></el-icon>
            <span>Java DTO 转 TS</span>
          </el-menu-item>
          <el-menu-item index="/zip">
            <el-icon><Document /></el-icon>
            <span>ZIP 压缩/解压</span>
          </el-menu-item>
          <el-menu-item index="/tree-visualizer">
            <el-icon><Share /></el-icon>
            <span>树形结构可视化</span>
          </el-menu-item>
          <el-menu-item index="/list-tree">
            <el-icon><Folder /></el-icon>
            <span>树列表可视化</span>
          </el-menu-item>
          <el-menu-item index="/python-runner">
            <el-icon><Monitor /></el-icon>
            <span>Python 在线运行</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-drawer>

    <div class="body-row">
      <!-- Desktop sidebar -->
      <el-aside
        :width="sidebarCollapsed ? '64px' : '200px'"
        class="side-bar"
        :class="{ collapsed: sidebarCollapsed }"
      >
        <div class="logo-area">
          <span class="logo-dot" />
          <span v-show="!sidebarCollapsed" class="logo-text">实用前端工具</span>
        </div>
        <el-menu
          :default-active="route.path"
          router
          :collapse="sidebarCollapsed"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页总览</span>
          </el-menu-item>
          <el-menu-item index="/java-to-ts">
            <el-icon><DataAnalysis /></el-icon>
            <span>Java DTO 转 TS</span>
          </el-menu-item>
          <el-menu-item index="/zip">
            <el-icon><Document /></el-icon>
            <span>ZIP 压缩/解压</span>
          </el-menu-item>
          <el-menu-item index="/tree-visualizer">
            <el-icon><Share /></el-icon>
            <span>树形结构可视化</span>
          </el-menu-item>
          <el-menu-item index="/list-tree">
            <el-icon><Folder /></el-icon>
            <span>树列表可视化</span>
          </el-menu-item>
          <el-menu-item index="/python-runner">
            <el-icon><Monitor /></el-icon>
            <span>Python 在线运行</span>
          </el-menu-item>
        </el-menu>
        <div class="sidebar-footer">
          <el-tooltip
            :content="sidebarCollapsed ? '展开菜单' : '折叠菜单'"
            placement="right"
          >
            <el-button text class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
              <el-icon><Fold /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </el-aside>

      <!-- Content area -->
      <div class="content-col">
        <el-main class="main-area">
          <router-view />
        </el-main>

        <div class="global-footer">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <span>Built with</span>
          <strong>Vue 3</strong>
          <span class="footer-sep">+</span>
          <strong>Vite</strong>
          <span class="footer-sep">+</span>
          <strong>ECharts</strong>
          <span class="footer-sep">·</span>
          <span class="footer-sub">wtools</span>
        </div>
      </div>
    </div>

    <!-- GitHub Corner -->
    <a
      href="https://github.com/Danburen/wtools"
      target="_blank"
      rel="noopener noreferrer"
      class="github-corner"
      aria-label="View source on GitHub"
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 250 250"
        class="github-corner-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="corner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5b73e0" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"
          fill="url(#corner-grad)"
        />
        <path
          d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
          fill="currentColor"
          class="octo-arm"
        />
        <path
          d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.4,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
          fill="currentColor"
          class="octo-body"
        />
      </svg>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarCollapsed = ref(false)
const drawerOpen = ref(false)

// Close drawer on resize to desktop
function onResize() {
  if (window.innerWidth >= 768) {
    drawerOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.app-wrapper {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ============================
   Mobile Top Bar
   ============================ */
.mobile-topbar {
  display: none;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 4px;
  background: #f8f9fc;
  border-bottom: 1px solid #e8ecf3;
  z-index: 100;
}
.mobile-title {
  font-size: 15px;
  font-weight: 700;
  color: #374151;
}
.burger-btn {
  border: none;
  color: #5b677b;
}

/* ============================
   Mobile Drawer
   ============================ */
.mobile-drawer .drawer-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.mobile-drawer .logo {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  border-bottom: 1px solid #e8ecf3;
  letter-spacing: 0.3px;
}
.mobile-drawer .el-menu {
  border-right: none;
}

/* ============================
   Body Row
   ============================ */
.body-row {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
}

/* ============================
   Sidebar
   ============================ */
.side-bar {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8f9fc 0%, #f1f3f8 100%);
  border-right: 1px solid #e8ecf3;
  transition: width 0.25s ease;
  overflow: hidden;
}
.logo-area {
  flex-shrink: 0;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid #e8ecf3;
  overflow: hidden;
  white-space: nowrap;
}
.side-bar.collapsed .logo-area {
  padding: 0;
  justify-content: center;
}
.logo-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b73e0, #8b5cf6);
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.3px;
}
.side-bar .el-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
  overflow-y: auto;
  padding: 8px 0;
}
.side-bar .el-menu:not(.el-menu--collapse) {
  padding: 8px 0;
}
.side-bar .el-menu--collapse {
  padding: 8px 0;
  width: 100%;
}
.side-bar .el-menu-item {
  height: 44px;
  line-height: 44px;
  margin: 2px 8px;
  border-radius: 8px;
  color: #5b677b;
  font-size: 13px;
  transition: background 0.2s, color 0.2s;
}
.side-bar .el-menu-item.is-active {
  background: linear-gradient(135deg, #eef0ff, #f5f3ff);
  color: #5b73e0;
  font-weight: 600;
  position: relative;
}
.side-bar .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #5b73e0, #8b5cf6);
}
.side-bar .el-menu-item:not(.is-active):hover {
  background: rgba(91, 115, 224, 0.06);
  color: #374151;
}
.side-bar .el-menu-item .el-icon {
  color: inherit;
  font-size: 16px;
}

/* Sidebar collapse footer */
.sidebar-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid #e8ecf3;
}
.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 16px;
  transition: background 0.2s, color 0.2s;
}
.collapse-btn:hover {
  background: rgba(91, 115, 224, 0.06);
  color: #5b73e0;
}

/* ============================
   GitHub Corner
   ============================ */
.github-corner {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: 56px;
  height: 56px;
  cursor: pointer;
  text-decoration: none;
}
.github-corner .github-corner-svg {
  fill: #5b73e0;
  color: #fff;
  position: absolute;
  top: 0;
  right: 0;
  border: 0;
  filter: drop-shadow(0 2px 6px rgba(91, 115, 224, 0.3));
  transition: filter 0.25s;
}
.github-corner:hover .github-corner-svg {
  filter: drop-shadow(0 4px 12px rgba(91, 115, 224, 0.5));
}
.github-corner .octo-arm {
  transform-origin: 130px 106px;
  transition: transform 0.25s;
}
.github-corner:hover .octo-arm {
  animation: octocat-wave 560ms ease-in-out;
}

@keyframes octocat-wave {
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-25deg); }
  40%, 80% { transform: rotate(10deg); }
}

/* ============================
   Content Column
   ============================ */
.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
}
.main-area {
  flex: 1;
  min-height: 0;
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

/* ============================
   Global Footer
   ============================ */
.global-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 20px;
  font-size: 12px;
  color: #9ca3af;
  background: #fff;
  border-top: 1px solid #f0f1f5;
}
.footer-sep {
  color: #d4d8e0;
  margin: 0 1px;
}
.footer-sub {
  color: #b0b7c3;
}
.global-footer strong {
  font-weight: 600;
  color: #6b7280;
}
.global-footer svg {
  opacity: 0.5;
}

/* ============================
   Responsive: Mobile
   ============================ */
@media (max-width: 767px) {
  .mobile-topbar {
    display: flex;
  }
  .side-bar {
    display: none !important;
  }
  .main-area {
    padding: 12px;
  }
  .github-corner {
    width: 40px;
    height: 40px;
  }
}
</style>
