<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">实用前端工具</div>
      <el-menu
        class="el-menu-vertical"
        :default-active="route.path"
        router
      >
        <el-menu-item index="/java-to-ts">
          <el-icon><DataAnalysis /></el-icon>
          <span>Java DTO 转 TS</span>
        </el-menu-item>
        <el-menu-item index="/zip">
          <el-icon><Document /></el-icon>
          <span>ZIP 压缩/解压</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="main-area">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Document, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}
.el-aside {
  background-color: #f5f7fa;
  border-right: solid 1px var(--el-menu-border-color);
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
}
.el-menu-vertical {
  border-right: none;
  background-color: transparent;
}
.main-area {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
