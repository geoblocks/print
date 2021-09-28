import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  target: "ES2020",
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: /^lit|ol/,
      input: {
        demo: 'src/main.ts'
      }
    }
  }
})
