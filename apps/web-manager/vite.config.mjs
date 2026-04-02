import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['cubrid-logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'CUBRID Web Manager',
        short_name: 'CWM',
        description: 'Modern Web-based Management Interface for CUBRID Database.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  /** Nx 모노레포·`tools/serve-web-manager.js`와 동일: 루트 `dist/apps/web-manager` */
  build: {
    outDir: '../../dist/apps/web-manager',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: '0.0.0.0', // Necessary for Tailscale/Docker
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: true
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  }
})