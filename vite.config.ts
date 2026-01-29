import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 创建版本 API 插件

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // pako 压缩库单独打包（只在导入时使用）
          if (id.includes('node_modules/pako')) {
            return 'pako-vendor';
          }

          // pinyin-pro 拼音库单独打包（只在搜索时使用）
          if (id.includes('node_modules/pinyin-pro')) {
            return 'pinyin-vendor';
          }

          // MUI 核心库和图标（最大的依赖包）
          if (id.includes('node_modules/@mui/material') || id.includes('node_modules/@mui/icons-material')) {
            return 'mui-vendor';
          }

          // 其他所有第三方库（包括 React、Emotion 等）
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  }
})
