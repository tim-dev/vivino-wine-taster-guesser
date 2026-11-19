// Vercel serverless function. vercel.json rewrites every /api/* request here,
// and the shared Express app handles it.
import app from '../server/app.js';

export default app;
