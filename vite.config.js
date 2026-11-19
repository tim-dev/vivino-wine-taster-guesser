import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api is handled by the Express server (server/app.js), not by Vite.
export default defineConfig({
  plugins: [react()],
});
