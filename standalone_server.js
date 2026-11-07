// Zero-Dependency HTTP Static Server for Connected Vehicle & Digital Twin
// Uses ONLY built-in Node.js standard library (http, fs, path).
// NO 'npm install' or third-party packages required!

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function createStaticServer(port, rootDir, name) {
  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/') cleanUrl = '/index.html';

    const safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(rootDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${cleanUrl}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[OK] ${name} running at http://localhost:${port}`);
  });

  return server;
}

const carRoot = path.join(__dirname, 'dist');
const twinRoot = path.join(__dirname, 'Digital Twin', 'dist');

console.log('======================================================================');
console.log('   CONNECTED VEHICLE ECOSYSTEM - ZERO-DEPENDENCY STANDALONE SERVER');
console.log('   No npm install required! Running directly via Node.js Standard Lib');
console.log('======================================================================');

createStaticServer(3000, carRoot, 'Virtual Car Simulator');
createStaticServer(3001, twinRoot, 'Digital Twin Observatory');

console.log('\nBoth servers are active:');
console.log('-> Virtual Car Simulator: http://localhost:3000');
console.log('-> Digital Twin Platform: http://localhost:3001');
console.log('\nTelemetry synchronizes in real time via browser BroadcastChannel.\n');

