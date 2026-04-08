import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['police.webp'],
      manifest: {
        name: 'Dashmark',
        short_name: 'Dashmark',
        description: '现代化书签管理器 - v2.0 支持 PWA、标签、云同步',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      }
    })
  ],
  publicDir: 'src/public',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Dexie (IndexedDB ORM) 单独打包
          if (id.includes('node_modules/dexie')) {
            return 'dexie-vendor';
          }

          // pako 压缩库单独打包（只在导入时使用）
          if (id.includes('node_modules/pako')) {
            return 'pako-vendor';
          }

          // pinyin-pro 拼音库单独打包（只在搜索时使用）
          if (id.includes('node_modules/pinyin-pro')) {
            return 'pinyin-vendor';
          }

          // react-virtual 虚拟滚动单独打包
          if (id.includes('node_modules/react-virtual')) {
            return 'virtual-vendor';
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
