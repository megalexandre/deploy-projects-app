import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/deploy-projects-app/'

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
          target: 'https://project-deploy.shop',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
