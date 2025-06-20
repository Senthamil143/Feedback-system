import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/users': 'http://localhost:8000',
      '/feedback': 'http://localhost:8000',
    },
  },
});
