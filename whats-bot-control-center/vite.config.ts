import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  // Garante que as URLs finais sejam relativas
  base: './',

  // Plugins
  plugins: [
    react(),
  ],

  // Alias para imports (ex.: import Foo from '@/components/Foo')
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Pasta de assets estáticos
  publicDir: resolve(__dirname, 'public'),

  build: {
    // Saída do build
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,

    // Aponta explicitamente para o index.html dentro de public
    rollupOptions: {
      input: resolve(__dirname, 'public/index.html'),
    },
  },
})
