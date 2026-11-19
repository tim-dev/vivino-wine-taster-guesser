import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Requests to /api/* are proxied to go-api so the browser never makes a
// cross-origin call. Point VITE_API_TARGET at whichever go-api you want.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:9000';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
