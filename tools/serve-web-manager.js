#!/usr/bin/env node

/**
 * Simple static file server for web-manager build output.
 *
 * Usage:
 *   node serve-web-manager.js [port]
 *   example: node serve-web-manager.js 4200
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] ? parseInt(process.argv[2], 10) : 4200;
const BUILD_DIR = path.join(__dirname, '..', 'dist', 'apps', 'web-manager');

// MIME type map
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS headers (if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Normalize URL
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0]; // Remove query string
  
  // Resolve full file path
  const fullPath = path.join(BUILD_DIR, filePath);

  // Security: block path traversal outside BUILD_DIR
  if (!fullPath.startsWith(BUILD_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(BUILD_DIR, 'index.html');
      serveFile(indexPath, res);
      return;
    }

    serveFile(fullPath, res);
  });
});

// Verify build directory
if (!fs.existsSync(BUILD_DIR)) {
  console.error(`❌ Build directory not found: ${BUILD_DIR}`);
  console.error('Build first with:');
  console.error('  nx build web-manager');
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Web Manager server started`);
  console.log(`📁 Serving directory: ${BUILD_DIR}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`   or: http://0.0.0.0:${PORT}`);
  console.log(`\nPress Ctrl+C to stop.`);
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`Use another port: node serve-web-manager.js [port]`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
