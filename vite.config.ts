import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取版本号
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// 创建版本 API 插件
function versionApiPlugin() {
  return {
    name: 'version-api',
    generateBundle() {
      // 确保 api/v1 目录存在
      const apiDir = join(__dirname, 'dist', 'api', 'v1')
      if (!existsSync(apiDir)) {
        mkdirSync(apiDir, { recursive: true })
      }
      
      // 创建 version.html 文件（纯 JSON 响应）
      writeFileSync(
        join(apiDir, 'version.html'),
        JSON.stringify({ version: packageJson.version }, null, 2)
      )
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // pako 压缩库单独打包（只在导入时使用）
          if (id.includes('node_modules/pako')) {
            return 'pako-vendor';
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
