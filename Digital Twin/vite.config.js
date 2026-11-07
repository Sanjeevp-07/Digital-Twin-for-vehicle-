import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3001,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
