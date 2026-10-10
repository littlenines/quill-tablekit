/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [dts({ bundleTypes: true })],
  build: {
    lib: { entry: 'src/index.ts', name: 'QuillTableKit', fileName: (format) => `index.${format}.js` },
    rollupOptions: {
      external: ['quill'],
      output: [
        { format: 'es', entryFileNames: 'index.es.js', globals: { quill: 'Quill' } },
        { format: 'cjs', entryFileNames: 'index.cjs.js', globals: { quill: 'Quill' } },
        { format: 'iife', name: 'QuillTableKit', entryFileNames: 'index.iife.js', globals: { quill: 'Quill' } },
      ],
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
})
