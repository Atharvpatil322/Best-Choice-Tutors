import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const vitePrerender = require('vite-plugin-prerender')

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

/**
 * Apply the same server-side SEO injection in development that Express applies
 * in production, so `view-source` on the dev server shows the real title,
 * description, canonical tag and structured data.
 *
 * Without this, editing SEO settings appears to do nothing on :5173 because
 * Vite serves index.html untouched, which is misleading when checking work.
 * Failures are ignored: if the API is down the untouched page is still served.
 */
function devSeoHtml() {
  const apiBase = (process.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')
  const origin = apiBase.replace(/\/api$/, '')

  return {
    name: 'dev-seo-html',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const path = (ctx.originalUrl || '/').split('?')[0]
        try {
          const response = await fetch(`${origin}/__seo-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, html }),
          })
          if (!response.ok) return html
          const data = await response.json()
          return data.html || html
        } catch {
          return html
        }
      },
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    publicImagesCacheHeaders(),
    devSeoHtml(),
    vitePrerender({
      staticDir: path.resolve(__dirname, 'dist'),
      routes: [
        '/',
        '/about',
        '/contact',
        '/policy',
        '/privacy-policy',
        '/terms',
        '/how-it-works',
        '/blog',
      ],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // The prerender step runs Chromium 78, which predates optional chaining and
    // nullish coalescing. Targeting es2019 makes esbuild transpile those away so
    // the prerenderer can execute the bundle; without it every prerendered page
    // is an empty shell. Still supported by every browser the site targets.
    target: 'es2019',
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
