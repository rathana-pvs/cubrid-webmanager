#!/usr/bin/env node

/**
 * Start api-server and HTTPS web-manager proxy together.
 * - API_START: default dev:api-server
 * - API_WAIT_HOST: default 127.0.0.1
 * - API_WAIT_PORT: default 8080
 * - API_WAIT_TIMEOUT_MS: default 120000
 * - WEB_HTTPS_PORT: default 443
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const treeKill = require('tree-kill');
const { loadWorkspaceEnv } = require('./load-workspace-env');

const REPO_ROOT = path.join(__dirname, '..');
const loadedEnvFile = loadWorkspaceEnv();
if (loadedEnvFile) {
  console.log(`[stack] loaded env: ${loadedEnvFile}`);
}
const API_START = process.env.API_START || 'dev:api-server';
const API_WAIT_HOST = process.env.API_WAIT_HOST || '127.0.0.1';
const API_WAIT_PORT = parseInt(process.env.API_WAIT_PORT || process.env.PORT || '8080', 10);
const API_WAIT_TIMEOUT_MS = parseInt(process.env.API_WAIT_TIMEOUT_MS || '120000', 10);
const WEB_HTTPS_PORT = process.argv[2] || process.env.WEB_HTTPS_PORT || '443';

const isProduction = (process.env.ENVIRONMENT || '').toLowerCase() === 'production';
const WEB_DEV_HOST = process.env.WEB_DEV_HOST || '127.0.0.1';
const WEB_DEV_PORT = parseInt(process.env.WEB_DEV_PORT || '5173', 10);

let apiChild = null;
let webChild = null;
let webDevChild = null;
let shuttingDown = false;

function waitTcpReady(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Port wait timeout: ${host}:${port}`));
        return;
      }

      const socket = net.createConnection({ host, port });
      socket.on('connect', () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        setTimeout(tick, 300);
      });
    };
    tick();
  });
}

function killTree(pid) {
  return new Promise((resolve) => {
    if (!pid) {
      resolve();
      return;
    }
    treeKill(pid, 'SIGTERM', () => resolve());
  });
}

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  await killTree(webChild && webChild.pid);
  await killTree(webDevChild && webDevChild.pid);
  await killTree(apiChild && apiChild.pid);
  process.exit(code);
}

function startApi() {
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  apiChild = spawn(npmBin, ['run', API_START], {
    cwd: REPO_ROOT,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

function startWebDev() {
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  webDevChild = spawn(npmBin, ['run', 'dev:web-manager'], {
    cwd: REPO_ROOT,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

function startWebProxy() {
  const scriptPath = path.join(__dirname, 'serve-web-manager-https-proxy.js');
  webChild = spawn(process.execPath, [scriptPath, WEB_HTTPS_PORT], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

process.on('SIGINT', () => void shutdown(130));
process.on('SIGTERM', () => void shutdown(143));

startApi();
console.log(`[stack] starting API: npm run ${API_START}`);
console.log(`[stack] waiting for API: ${API_WAIT_HOST}:${API_WAIT_PORT}`);

const waitPromises = [
  waitTcpReady(API_WAIT_HOST, API_WAIT_PORT, API_WAIT_TIMEOUT_MS)
];

if (!isProduction) {
  startWebDev();
  console.log(`[stack] starting Vite Dev: npm run dev:web-manager`);
  console.log(`[stack] waiting for Vite Dev: ${WEB_DEV_HOST}:${WEB_DEV_PORT}`);
  waitPromises.push(waitTcpReady(WEB_DEV_HOST, WEB_DEV_PORT, API_WAIT_TIMEOUT_MS));
}

Promise.all(waitPromises)
  .then(() => {
    console.log(`[stack] Services are ready -> starting HTTPS proxy (:${WEB_HTTPS_PORT})`);
    startWebProxy();

    if (apiChild) {
      apiChild.on('exit', async (code) => {
        if (shuttingDown) return;
        await shutdown(code || 1);
      });
    }
    if (webDevChild) {
      webDevChild.on('exit', async (code) => {
        if (shuttingDown) return;
        await shutdown(code || 1);
      });
    }
    if (webChild) {
      webChild.on('exit', async (code) => {
        if (shuttingDown) return;
        await shutdown(code || 1);
      });
    }
  })
  .catch(async (err) => {
    console.error(`[stack] ${err.message}`);
    await shutdown(1);
  });
