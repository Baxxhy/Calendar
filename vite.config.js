import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true
  },
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 构建输出目录
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
