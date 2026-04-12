import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** Long-lived cache for files served from `public/images` (dev + preview). Production CDN/reverse-proxy should mirror this. */
function publicImagesCacheHeaders() {
  const setHeaders = (_req, res, next) => {
    const url = _req.url || ''
    if (url.startsWith('/images/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
    next()
  }
  return {
    name: 'public-images-cache',
    configureServer(server) {
      server.middlewares.use(setHeaders)
    },
    configurePreviewServer(server) {
      server.middlewares.use(setHeaders)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), publicImagesCacheHeaders()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
    optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
})
