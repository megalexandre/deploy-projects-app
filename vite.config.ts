import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = command === 'serve' ? '/' : '/deploy-projects-app/'
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim()

  if (!apiProxyTarget) {
    throw new Error('Variavel de ambiente obrigatoria ausente: VITE_API_PROXY_TARGET')
  }

  return {
    base,
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
