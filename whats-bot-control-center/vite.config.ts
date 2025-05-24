import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',            // garante paths relativos em dist
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      // aponta explicitamente para o seu index.html
      input: resolve(__dirname, 'index.html'),
    }
  }
})
