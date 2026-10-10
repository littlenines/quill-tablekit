import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'quill-tablekit': fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
    // Source and demo must share one Quill instance
    dedupe: ['quill'],
  },
})
