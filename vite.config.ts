import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
          // 其他第三方库打包在一起
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600 // 调整警告阈值到 600KB
  }
})
