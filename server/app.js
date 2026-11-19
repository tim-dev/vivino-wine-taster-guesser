import express from 'express';

// The Express app that proxies /api/* to go-api, so the browser never makes a
// cross-origin call. It's shared by the local server (server/index.js) and the
// Vercel function (api/index.js).
//
// API_TARGET is the go-api base URL, e.g. https://some-go-api-host.
const API_TARGET = (process.env.API_TARGET || 'http://localhost:9000').replace(/\/+$/, '');

// Request headers worth passing through to go-api.
const FORWARD_HEADERS = ['accept', 'accept-language'];

const app = express();

const api = express.Router();

api.get('/*path', async (req, res) => {
  // Mounted at /api, so req.url is already "/wines/123/tastes?language=en".
  const url = API_TARGET + req.url;

  const headers = {};
  for (const name of FORWARD_HEADERS) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }

  try {
    const upstream = await fetch(url, { headers });
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error(`Proxy error for ${url}:`, err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
});

app.use('/api', api);

export default app;
