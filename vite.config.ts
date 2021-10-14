import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: /^lit|ol/,
      input: {
        demo: 'src/main.ts',
      },
    },
  },
});
