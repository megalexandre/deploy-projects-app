import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = command === 'serve' ? '/' : (process.env.VITE_BASE ?? '/deploy-projects-app/')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim()

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    server: apiProxyTarget
      ? {
          proxy: {
            // Regra mais específica primeiro: /api/v1/* (filesService) → sem rewrite
            '/api/v1': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: true
            },
            // /api/* → /api/v2/* (API principal)
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api/, '/api/v2')
            }
          }
        }
      : undefined
  }
})
