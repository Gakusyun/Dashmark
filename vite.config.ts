import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['police.webp', 'favicon.ico'],
      manifest: {
        name: 'DashMark',
        short_name: 'DashMark',
        description: '现代化书签管理器 - 支持 PWA、标签、云同步',
        theme_color: '#4f46e5',
        background_color: '#f6f7f9',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
        ],
      },
    }),
  ],
  publicDir: 'public',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Dexie (IndexedDB ORM) 单独打包
          if (id.includes('node_modules/dexie')) {
            return 'dexie-vendor'
          }

          // pako 压缩库单独打包（只在导入时使用）
          if (id.includes('node_modules/pako')) {
            return 'pako-vendor'
          }

          // pinyin-pro 拼音库单独打包（只在搜索时使用）
          if (id.includes('node_modules/pinyin-pro')) {
            return 'pinyin-vendor'
          }

          // 其他所有第三方库（包括 React 等）
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
