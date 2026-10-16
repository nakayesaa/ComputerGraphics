import { defineConfig } from 'vite';
// Source HTML is separate so the repository can also serve the built app on Pages.
export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: { outDir: '../dist', emptyOutDir: true }
});
