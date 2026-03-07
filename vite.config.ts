<<<<<<< HEAD
/** Configuracao do Vite para build, dev server e integracoes do frontend. */
import { defineConfig } from 'vite'
=======
>>>>>>> fc859f718938ae1c9d8695b354eb4c0aa4a4c28d
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

<<<<<<< HEAD
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/deploy-projects-app/';
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
  };
});
=======
// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/deploy-projects-app/' : './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
>>>>>>> fc859f718938ae1c9d8695b354eb4c0aa4a4c28d
