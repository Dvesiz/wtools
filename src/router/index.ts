import { createRouter, createWebHistory } from 'vue-router'
import JavaToTsView from '../views/JavaToTsView.vue'
import ZipToolView from '../views/ZipToolView.vue'
import TreeVisualizerView from '../views/TreeVisualizerView.vue'
import ListTreeVisualizerView from '../views/ListTreeVisualizerView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/tree-visualizer' },
    { path: '/java-to-ts', name: 'java-to-ts', component: JavaToTsView },
    { path: '/zip', name: 'zip', component: ZipToolView },
    { path: '/tree-visualizer', name: 'tree-visualizer', component: TreeVisualizerView },
    { path: '/list-tree', name: 'list-tree', component: ListTreeVisualizerView }
  ]
})

export default router

