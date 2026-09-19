import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/questions': 'http://localhost:8000',
      '/analyze': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/interview': 'http://localhost:8000',
      '/cheatsheet': 'http://localhost:8000',
      '/debrief': 'http://localhost:8000',
      '/negotiation': 'http://localhost:8000',
      '/gamification': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/share': 'http://localhost:8000',
    }
  }
});
