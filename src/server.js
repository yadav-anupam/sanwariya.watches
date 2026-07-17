import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
  // Strip query string and hashes
  const cleanUrl = req.url.split('?')[0].split('#')[0];
  
  // Normalize path to prevent directory traversal
  let safeSuffix = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
  
  // Default to index.html for root
  if (safeSuffix === '/' || safeSuffix === '' || safeSuffix === '\\') {
    safeSuffix = '/index.html';
  }

  let filePath = path.join(DIST_DIR, safeSuffix);
  
  // Check if file exists. If not, or if it is a directory, fall back to index.html for SPA routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  // If even index.html doesn't exist (e.g. build hasn't run yet), return a simple loading message
  if (!fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Sanwariya Watches is building...</h1><p>Please refresh in a moment once the build completes.</p>');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
