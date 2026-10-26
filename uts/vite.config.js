import { defineConfig } from 'vite';

export default defineConfig({
  base: "./",
  // Memakai polling agar perubahan file pada mount Windows terdeteksi saat development.
  server: { watch: { usePolling: true, interval: 500 } },
});
