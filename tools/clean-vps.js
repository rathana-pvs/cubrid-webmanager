const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Attempt to load environment variables from e2e/.env and root .env
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../e2e/.env'),
    path.resolve(__dirname, '../.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      if (typeof process.loadEnvFile === 'function') {
        try {
          process.loadEnvFile(envPath);
        } catch {
          // ignore parsing error
        }
      } else {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

// 2. Resolve parameters from environment variables
const VPS_HOST = process.env.VPS_HOST || process.env.E2E_HOST_ADDRESS || 'localhost';
const VPS_PORT = process.env.VPS_PORT || process.env.VPS_SSH_PORT || '22';
const VPS_USER = process.env.VPS_USER || process.env.USER || 'cubrid';
const VPS_PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD || '';
const VPS_KEY = process.env.VPS_KEY || process.env.VPS_SSH_KEY || '';
const DOCKER_CONTAINER = process.env.CUBRID_CONTAINER || process.env.DOCKER_CONTAINER || '';
const CUBRID_DIR = process.env.CUBRID_DIR || '/home/cubrid/CUBRID';
const E2E_DB = process.env.E2E_DB || 'demodb';
const E2E_OFFLINE_DB = process.env.E2E_OFFLINE_DB || 'db1';

const isLocal = VPS_HOST === 'localhost' || VPS_HOST === '127.0.0.1';

console.log(`🧹 Cleaning test data on target: ${VPS_USER}@${VPS_HOST}:${VPS_PORT} (${DOCKER_CONTAINER ? `Container: ${DOCKER_CONTAINER}` : 'Native'})...`);

// 3. Build cleanup payload executed in the CUBRID environment
const cleanupCommands = [
  `rm -rf "${CUBRID_DIR}/databases/e2e_"* "${CUBRID_DIR}/databases/testbench" "${CUBRID_DIR}/databases/unloaddb.info"`,
  `[ -f "${CUBRID_DIR}/databases/databases.txt" ] && sed -i '/e2e_/d' "${CUBRID_DIR}/databases/databases.txt" || true`,
  `[ -f "${CUBRID_DIR}/conf/cmdb.pass" ] && sed -i '/e2e_/d' "${CUBRID_DIR}/conf/cmdb.pass" || true`,
  `[ -f "${CUBRID_DIR}/conf/autoaddvoldb.conf" ] && truncate -s 0 "${CUBRID_DIR}/conf/autoaddvoldb.conf" || true`,
  `[ -f "${CUBRID_DIR}/conf/autobackupdb.conf" ] && truncate -s 0 "${CUBRID_DIR}/conf/autobackupdb.conf" || true`,
  `[ -f "${CUBRID_DIR}/conf/autoexecquery.conf" ] && truncate -s 0 "${CUBRID_DIR}/conf/autoexecquery.conf" || true`,
  `gosu cubrid cubrid server stop ${E2E_OFFLINE_DB} 2>/dev/null || cubrid server stop ${E2E_OFFLINE_DB} 2>/dev/null || true`,
  `gosu cubrid cubrid server start ${E2E_DB} 2>/dev/null || cubrid server start ${E2E_DB} 2>/dev/null || true`,
  `gosu cubrid cubrid server status 2>/dev/null || cubrid server status 2>/dev/null || true`,
].join('; ');

// 4. Wrap with docker / sudo if needed
let innerCommand;
if (DOCKER_CONTAINER) {
  const sudoPrefix = VPS_PASS ? `echo ${VPS_PASS} | sudo -S ` : (process.env.USE_SUDO === 'true' ? 'sudo ' : '');
  innerCommand = `${sudoPrefix}docker exec ${DOCKER_CONTAINER} bash -c '${cleanupCommands}'`;
} else {
  innerCommand = `bash -c '${cleanupCommands}'`;
}

// 5. Wrap with SSH if remote
let fullCommand;
if (isLocal && !process.env.FORCE_SSH) {
  fullCommand = innerCommand;
} else {
  let sshPrefix = '';
  const baseOpts = '-o StrictHostKeyChecking=no -o ConnectTimeout=10';
  if (VPS_KEY) {
    sshPrefix = `ssh -i '${VPS_KEY}' -p ${VPS_PORT} ${baseOpts} ${VPS_USER}@${VPS_HOST}`;
  } else if (VPS_PASS) {
    sshPrefix = `sshpass -p '${VPS_PASS}' ssh -p ${VPS_PORT} ${baseOpts} ${VPS_USER}@${VPS_HOST}`;
  } else {
    sshPrefix = `ssh -p ${VPS_PORT} ${baseOpts} -o BatchMode=yes ${VPS_USER}@${VPS_HOST}`;
  }
  fullCommand = `${sshPrefix} "${innerCommand.replace(/"/g, '\\"')}"`;
}

// 6. Execute cleanup
try {
  const output = execSync(fullCommand, { encoding: 'utf8', stdio: 'pipe' });
  if (output && output.trim()) {
    console.log(output.trim());
  }
  console.log('✅ VPS / test environment cleaned successfully.');
} catch (err) {
  console.error('❌ Failed to clean target environment:', err.message);
  if (err.stderr) console.error(err.stderr.toString());
  console.error('\nTip: You can configure connection parameters via environment variables or e2e/.env:');
  console.error('  - VPS_HOST (or E2E_HOST_ADDRESS)');
  console.error('  - VPS_PORT (default: 22)');
  console.error('  - VPS_USER');
  console.error('  - VPS_PASS (or VPS_KEY)');
  console.error('  - CUBRID_CONTAINER (if using Docker)');
  process.exit(1);
}

