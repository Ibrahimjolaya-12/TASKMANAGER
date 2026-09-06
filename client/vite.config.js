import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Apne Express backend ka port yahan likhein (e.g., 5000 ya jo bhi ho)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});