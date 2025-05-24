import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  // instrui o Vite onde está o index.html
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // agora "@/" = src/
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [react()],
})
