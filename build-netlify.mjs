/**
 * Post-build script for Netlify static deployment.
 * Calls the SSR handler directly to produce an index.html shell,
 * then writes it to dist/client/ so Netlify can use it as the SPA fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { default: app } = await import('./dist/server/server.js');

const request = new Request('http://localhost/', {
  method: 'GET',
  headers: { host: 'localhost' },
});

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
const response = await app.fetch(request, {}, ctx);

if (!response.ok && response.status !== 200) {
  console.warn(`SSR returned status ${response.status}, proceeding anyway`);
}

let html = await response.text();

// Fix asset paths so they work from any route on Netlify
// (replace relative ./assets/ references with absolute /assets/)
html = html.replace(/(src|href)="\.\/assets\//g, '$1="/assets/');

const outPath = path.join(__dirname, 'dist', 'client', 'index.html');
fs.writeFileSync(outPath, html, 'utf8');

console.log(`index.html written to ${outPath} (${html.length} bytes)`);
process.exit(0);
