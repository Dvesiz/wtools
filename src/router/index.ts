import { createRouter, createWebHistory } from 'vue-router'
import JavaToTsView from '../views/JavaToTsView.vue'
import ZipToolView from '../views/ZipToolView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/java-to-ts' },
    { path: '/java-to-ts', name: 'java-to-ts', component: JavaToTsView },
    { path: '/zip', name: 'zip', component: ZipToolView }
  ]
})

export default router

