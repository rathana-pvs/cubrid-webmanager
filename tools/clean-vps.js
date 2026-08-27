const { spawnSync } = require('child_process');
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
const VPS_PORT = String(process.env.VPS_PORT || process.env.VPS_SSH_PORT || '22');
const VPS_USER = process.env.VPS_USER || process.env.USER || 'cubrid';
const VPS_PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD || '';
const VPS_KEY = process.env.VPS_KEY || process.env.VPS_SSH_KEY || '';
const DOCKER_CONTAINER = process.env.CUBRID_CONTAINER || process.env.DOCKER_CONTAINER || '';
const CUBRID_DIR = process.env.CUBRID_DIR || '/home/cubrid/CUBRID';
const E2E_DB = process.env.E2E_DB || 'demodb';
const E2E_OFFLINE_DB = process.env.E2E_OFFLINE_DB || 'db1';

// Validate inputs to prevent injection
if (DOCKER_CONTAINER && !/^[a-zA-Z0-9_.-]+$/.test(DOCKER_CONTAINER)) {
  console.error('❌ Invalid container name:', DOCKER_CONTAINER);
  process.exit(1);
}
if (!/^\d+$/.test(VPS_PORT)) {
  console.error('❌ Invalid VPS_PORT:', VPS_PORT);
  process.exit(1);
}

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
  `gosu cubrid cubrid server stop "${E2E_OFFLINE_DB}" 2>/dev/null || cubrid server stop "${E2E_OFFLINE_DB}" 2>/dev/null || true`,
  `gosu cubrid cubrid server start "${E2E_DB}" 2>/dev/null || cubrid server start "${E2E_DB}" 2>/dev/null || true`,
  `gosu cubrid cubrid server status 2>/dev/null || cubrid server status 2>/dev/null || true`,
].join('\n') + '\n';

// 4. Build process execution with argv array (no shell interpolation)
let executable = '';
let args = [];
const spawnEnv = { ...process.env };

if (isLocal && !process.env.FORCE_SSH) {
  if (DOCKER_CONTAINER) {
    if (process.env.USE_SUDO === 'true') {
      executable = 'sudo';
      args = ['docker', 'exec', '-i', DOCKER_CONTAINER, 'bash'];
    } else {
      executable = 'docker';
      args = ['exec', '-i', DOCKER_CONTAINER, 'bash'];
    }
  } else {
    executable = 'bash';
    args = [];
  }
} else {
  const remoteCmd = DOCKER_CONTAINER
    ? (process.env.USE_SUDO === 'true'
        ? `sudo docker exec -i ${DOCKER_CONTAINER} bash`
        : `docker exec -i ${DOCKER_CONTAINER} bash`)
    : 'bash';

  const sshBaseOpts = [
    '-p', VPS_PORT,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ConnectTimeout=10',
  ];

  if (VPS_KEY) {
    executable = 'ssh';
    args = ['-i', VPS_KEY, ...sshBaseOpts, `${VPS_USER}@${VPS_HOST}`, remoteCmd];
  } else if (VPS_PASS) {
    executable = 'sshpass';
    spawnEnv.SSHPASS = VPS_PASS;
    args = ['-e', 'ssh', ...sshBaseOpts, `${VPS_USER}@${VPS_HOST}`, remoteCmd];
  } else {
    executable = 'ssh';
    args = [...sshBaseOpts, '-o', 'BatchMode=yes', `${VPS_USER}@${VPS_HOST}`, remoteCmd];
  }
}

// 5. Execute cleanup safely via spawnSync with stdin
const result = spawnSync(executable, args, {
  input: cleanupCommands,
  encoding: 'utf8',
  env: spawnEnv,
});

if (result.error) {
  console.error('❌ Failed to execute cleanup process:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`❌ Cleanup failed with exit code ${result.status}`);
  if (result.stderr && result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
  if (result.stdout && result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
  console.error('\nTip: You can configure connection parameters via environment variables or e2e/.env:');
  console.error('  - VPS_HOST (or E2E_HOST_ADDRESS)');
  console.error('  - VPS_PORT (default: 22)');
  console.error('  - VPS_USER');
  console.error('  - VPS_PASS (or VPS_KEY)');
  console.error('  - CUBRID_CONTAINER (if using Docker)');
  process.exit(1);
}

if (result.stdout && result.stdout.trim()) {
  console.log(result.stdout.trim());
}
console.log('✅ VPS / test environment cleaned successfully.');

