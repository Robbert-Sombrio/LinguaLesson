import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the extension's chrome-extension:// protocol resolves them correctly
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Sidebar UI (main React app)
        main: resolve(__dirname, 'index.html'),
        // Extension background service worker
        background: resolve(__dirname, 'src/background.ts'),
        // Content script injected into every page
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        // Keep entry file names predictable so manifest.json can reference them
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
