import { defineConfig } from 'vite';

export default defineConfig({
  base: "./",
  // The project lives on a Windows mount; polling keeps WSL edits visible.
  server: { watch: { usePolling: true, interval: 500 } },
});
