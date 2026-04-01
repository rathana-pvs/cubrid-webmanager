import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
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