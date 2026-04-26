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
const { config: loadEnv } = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

function loadRuntimeEnvForProxy() {
  const rawMode = (process.env.ENVIRONMENT || 'development').toLowerCase();
  const isProduction = rawMode === 'production';
  const isPkg = !!process.pkg;
  const baseDir = isPkg ? path.dirname(process.execPath) : process.cwd();

  const candidates = isProduction
    ? [
        '/etc/cubrid-webmanager.env',
        path.join(baseDir, 'apps/api-server/.env'),
        path.join(baseDir, '.env'),
      ]
    : [path.join(baseDir, '.env'), path.join(baseDir, 'apps/api-server/.env')];

  const envFilePath = candidates.find((p) => fs.existsSync(p));
  if (!envFilePath) {
    console.warn(`[proxy-env] no env file found (tried: ${candidates.join(', ')})`);
    return;
  }
  loadEnv({ path: envFilePath, override: false });
}

loadRuntimeEnvForProxy();

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_BUILD_DIR = path.join(REPO_ROOT, 'dist', 'apps', 'web-manager');
const DEFAULT_SSL_CERT = path.join(REPO_ROOT, 'apps', 'api-server', 'ssl', 'cert.pem');
const DEFAULT_SSL_KEY = path.join(REPO_ROOT, 'apps', 'api-server', 'ssl', 'key.pem');

const PORT = parseInt(process.argv[2] || process.env.WEB_HTTPS_PORT || '443', 10);
const API_TARGET = (process.env.API_TARGET || 'https://127.0.0.1:8080').replace(/\/$/, '');
const BUILD_DIR = process.env.BUILD_DIR ? path.resolve(process.env.BUILD_DIR) : DEFAULT_BUILD_DIR;
const proxyInsecureTls = (process.env.PROXY_INSECURE_TLS || '0').trim() === '1';

function resolvePathFromEnvOrDefault(envValue, fallbackPath) {
  if (!envValue) return fallbackPath;
  const candidate = envValue.trim();
  if (path.isAbsolute(candidate)) return candidate;
  return path.resolve(REPO_ROOT, candidate);
}

function loadHttpsCerts() {
  const certPath = resolvePathFromEnvOrDefault(process.env.SSL_CERT_PATH, DEFAULT_SSL_CERT);
  const keyPath = resolvePathFromEnvOrDefault(process.env.SSL_KEY_PATH, DEFAULT_SSL_KEY);

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

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`❌ build directory not found: ${BUILD_DIR}`);
  console.error('Run `npm run build:web-manager` first.');
  process.exit(1);
}

const app = express();

app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    secure: !proxyInsecureTls,
  })
);

app.use(express.static(BUILD_DIR, { index: false }));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

let certs;
try {
  certs = loadHttpsCerts();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const server = https.createServer({ key: certs.key, cert: certs.cert }, app);

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
