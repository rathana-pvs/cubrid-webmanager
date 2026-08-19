const fs = require('fs');
const path = require('path');

const E2E_ROOT = path.resolve(__dirname, '..');

function loadE2EEnv() {
  const envPath = path.join(E2E_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
}

loadE2EEnv();

function getCredentials() {
  return {
    username: process.env.E2E_USERNAME || 'e2e_shared_user',
    password: process.env.E2E_PASSWORD || 'Password123!',
  };
}

function getCmsTarget() {
  return {
    address: process.env.E2E_HOST_ADDRESS || 'localhost',
    port: Number(process.env.E2E_HOST_PORT || 8001),
    id: process.env.E2E_HOST_USER || 'admin',
    password: process.env.E2E_HOST_PASSWORD || 'admin',
    alias: process.env.E2E_HOST_ALIAS || 'E2E Test Host',
  };
}

function requireWebEnvironment() {
  // Web tests operate on a persisted, real CMS host. Never guess its
  // password: a wrong fallback can be saved by host-edit scenarios and
  // invalidate the remainder of the suite (and future runs).
  const missing = ['E2E_USERNAME', 'E2E_PASSWORD', 'E2E_HOST_PASSWORD']
    .filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(
      `Missing required web E2E variables: ${missing.join(', ')}. Copy e2e/.env.example to e2e/.env.`
    );
  }
}

module.exports = {
  E2E_ROOT,
  getCmsTarget,
  getCredentials,
  loadE2EEnv,
  requireWebEnvironment,
};
