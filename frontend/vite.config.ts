import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@shared': '/app/shared'
    }
  },
  server: {
    host: true,
    allowedHosts: ['server1','localhost','briscola.sirico.dev'],
    proxy: {
      '/api': {
        target: 'https://briscola.sirico.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: 'https://briscola.sirico.dev',
        changeOrigin: true,
        ws: true // Enable WebSocket proxying
      }
    }
  },
  build: {
    minify: 'esbuild', 
  },
})