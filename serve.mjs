import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '5000', 10);

const { default: app } = await import('./dist/server/server.js');

const staticDir = path.join(__dirname, 'dist', 'client');

const MIME_TYPES = {
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.html':  'text/html; charset=utf-8',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
};

function tryServeStatic(pathname, res) {
  try {
    const filePath = path.resolve(staticDir, '.' + pathname);
    if (!filePath.startsWith(staticDir)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    const isImmutable = pathname.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': isImmutable
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (tryServeStatic(url.pathname, res)) return;

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && chunks.length > 0;
    const body = hasBody ? Buffer.concat(chunks) : null;

    const requestUrl = `http://localhost:${PORT}${req.url || '/'}`;
    const headers = {};
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      headers[req.rawHeaders[i].toLowerCase()] = req.rawHeaders[i + 1];
    }

    const fetchRequest = new Request(requestUrl, {
      method: req.method || 'GET',
      headers,
      body: body || undefined,
      ...(body ? { duplex: 'half' } : {}),
    });

    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
    const response = await app.fetch(fetchRequest, {}, ctx);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') res.setHeader(key, value);
    });

    if (response.body) {
      for await (const chunk of response.body) res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error('[serve] Error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);
});
