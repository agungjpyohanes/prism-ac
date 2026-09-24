import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  },
  build: {
    outDir: 'build_output', // Menghindari bentrok folder dist yang terkunci
  }
});