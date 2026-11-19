import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import app from './app.js';

// Local server. In development, Vite runs inside Express as middleware (hot
// reload included). With NODE_ENV=production, it serves the built files in dist/.
// Deployed to Vercel, this file isn't used: see api/index.js and vercel.json.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 5173;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.get('/*splat', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`flavor-guess running at http://localhost:${port} (${isProd ? 'production' : 'dev'})`);
  console.log(`Proxying /api to ${process.env.API_TARGET || 'http://localhost:9000'}`);
});
