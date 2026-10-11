// import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // To use the local source instead of the npm package, uncomment this and the paths in tsconfig.app.json
    // alias: { 'quill-tablekit': fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
    // Source and demo must share one Quill instance
    dedupe: ['quill'],
  },
})
