#!/usr/bin/env node

/**
 * Serve web-manager dist over HTTPS and proxy `/api` requests to api-server.
 *
 * Env loading order (same as backend):
 * - production: /etc/cubrid-webmanager.env -> apps/api-server/.env -> .env
 * - non-production: .env -> apps/api-server/.env
 *
 * Main environment variables:
 * - WEB_HTTPS_PORT: HTTPS port (default 443)
 * - API_TARGET: proxy upstream (default https://127.0.0.1:8080)
 * - SSL_CERT_PATH / SSL_KEY_PATH: HTTPS PEM paths (prefer same certs as backend)
 * - PROXY_INSECURE_TLS: "1" disables API TLS verification (default 0)
 * - BUILD_DIR: static build directory (default dist/apps/web-manager)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { loadWorkspaceEnv } = require('./load-workspace-env');

const loadedEnvFile = loadWorkspaceEnv();
if (loadedEnvFile) {
  console.log(`[proxy-env] loaded env: ${loadedEnvFile}`);
} else {
  console.warn('[proxy-env] no env file found (tried apps/api-server/.env, .env, /etc/cubrid-webmanager.env)');
}

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_BUILD_DIR = path.join(REPO_ROOT, 'dist', 'apps', 'web-manager');
const DEFAULT_SSL_CERT = path.join(REPO_ROOT, 'apps', 'api-server', 'ssl', 'cert.pem');
const DEFAULT_SSL_KEY = path.join(REPO_ROOT, 'apps', 'api-server', 'ssl', 'key.pem');

const PORT = parseInt(process.argv[2] || process.env.WEB_HTTPS_PORT || '443', 10);
const API_TARGET = (process.env.API_TARGET || 'https://127.0.0.1:8080').replace(/\/$/, '');
const BUILD_DIR = process.env.BUILD_DIR ? path.resolve(process.env.BUILD_DIR) : DEFAULT_BUILD_DIR;
const proxyInsecureTls = (process.env.PROXY_INSECURE_TLS || '0').trim() === '1';
const isProduction = (process.env.ENVIRONMENT || '').toLowerCase() === 'production';
const useDevProxy = process.env.USE_DEV_PROXY === '1';
const WEB_DEV_TARGET = process.env.WEB_DEV_TARGET || 'http://127.0.0.1:5173';

function resolvePathFromEnvOrDefault(envValue, fallbackPath) {
  if (!envValue) return fallbackPath;
  const candidate = envValue.trim();
  if (path.isAbsolute(candidate)) return candidate;
  return path.resolve(REPO_ROOT, candidate);
}

function loadHttpsCerts() {
  let certPath = resolvePathFromEnvOrDefault(process.env.SSL_CERT_PATH, DEFAULT_SSL_CERT);
  let keyPath = resolvePathFromEnvOrDefault(process.env.SSL_KEY_PATH, DEFAULT_SSL_KEY);

  if (!process.env.SSL_CERT_PATH && (!fs.existsSync(certPath) || !fs.existsSync(keyPath))) {
    const distCert = path.join(REPO_ROOT, 'dist', 'ssl', 'cert.pem');
    const distKey = path.join(REPO_ROOT, 'dist', 'ssl', 'key.pem');
    if (fs.existsSync(distCert) && fs.existsSync(distKey)) {
      certPath = distCert;
      keyPath = distKey;
    }
  }

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error(
      `PEM files not found. SSL_CERT_PATH=${certPath}, SSL_KEY_PATH=${keyPath}`
    );
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    certPath,
    keyPath,
  };
}

if (!useDevProxy && !fs.existsSync(BUILD_DIR)) {
  console.error(`❌ build directory not found: ${BUILD_DIR}`);
  console.error('Run `npm run build:web-manager` first.');
  process.exit(1);
}

const app = express();

// Mount at root so Express does not strip the /api prefix before proxy sees it.
// pathFilter ensures only /api/* is forwarded; the full path (including /api)
// reaches NestJS which owns the prefix via setGlobalPrefix('api').
app.use(
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: !proxyInsecureTls,
    pathFilter: '/api',
  })
);

let devProxy;
if (!useDevProxy) {
  app.use(express.static(BUILD_DIR, { index: false }));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });
} else {
  console.log(`➡️  /* (dev assets) -> proxying to Vite Dev Server at ${WEB_DEV_TARGET}`);
  devProxy = createProxyMiddleware({
    target: WEB_DEV_TARGET,
    changeOrigin: true,
    ws: true,
  });
  app.use(devProxy);
}

let certs;
try {
  certs = loadHttpsCerts();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const server = https.createServer({ key: certs.key, cert: certs.cert }, app);

if (useDevProxy && devProxy) {
  server.on('upgrade', (req, socket, head) => {
    devProxy.upgrade(req, socket, head);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ port ${PORT} is already in use.`);
  } else if (err.code === 'EACCES') {
    console.error(
      `❌ insufficient privileges to bind port ${PORT}. Port 443 requires root or cap_net_bind_service.`
    );
  } else {
    console.error('❌ HTTPS proxy server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 web-manager HTTPS + /api reverse proxy');
  console.log(`🌐 https://0.0.0.0:${PORT}`);
  console.log(`📁 BUILD_DIR: ${BUILD_DIR}`);
  console.log(`🔐 CERT: ${certs.certPath}`);
  console.log(`🔐 KEY : ${certs.keyPath}`);
  console.log(`➡️  /api/* -> ${API_TARGET}/*`);
  console.log(`🔓 PROXY_INSECURE_TLS: ${proxyInsecureTls ? '1' : '0'}`);
});
