import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  define: command === 'build' ? {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })),
  } : {},
  plugins: [
    react(),
    {
      name: 'inject-build-time',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html.replace(
            '%VITE_BUILD_TIME%',
            command === 'build' ? new Date().toLocaleString('no-NO', { timeZone: 'Europe/Oslo' }) : 'dev',
          )
        },
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))