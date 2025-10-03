import { defineConfig } from 'vite'

// Vite config to ensure dev server binds to IPv4 localhost and uses a stable port
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    https: false
  }
})
