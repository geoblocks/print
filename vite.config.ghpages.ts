import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'ghpages',
    sourcemap: true,
    rollupOptions: {
      input: {
        demo: 'index.html',
      },
    },
  },
});
