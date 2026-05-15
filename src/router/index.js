import { createRouter, createWebHashHistory } from 'vue-router'
import MainPage from '../pages/MainPage.vue'
import WidgetPage from '../pages/WidgetPage.vue'

// 使用 hash 模式，兼容 Electron 文件协议
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainPage
    },
    {
      path: '/widget',
      name: 'widget',
      component: WidgetPage
    }
  ]
})

export default router
