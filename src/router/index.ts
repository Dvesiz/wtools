import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                name: 'index',           component: () => import('../views/IndexView.vue') },
    { path: '/java-to-ts',      name: 'java-to-ts',      component: () => import('../views/JavaToTsView.vue') },
    { path: '/zip',             name: 'zip',             component: () => import('../views/ZipToolView.vue') },
    { path: '/tree-visualizer', name: 'tree-visualizer', component: () => import('../views/TreeVisualizerView.vue') },
    { path: '/list-tree',       name: 'list-tree',       component: () => import('../views/ListTreeVisualizerView.vue') },
    { path: '/python-runner',   name: 'python-runner',   component: () => import('../views/PythonRunnerView.vue') },
    { path: '/video-to-gif',    name: 'video-to-gif',    component: () => import('../views/VideoToGifView.vue') },
    { path: '/markdown-to-word', name: 'markdown-to-word', component: () => import('../views/MarkdownToWordView.vue') },
  ],
})

export default router
