/* eslint-disable no-empty-pattern -- Playwright fixtures require an object-pattern dependency argument. */
const { test: base, _electron: electron, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getCmsTarget, getCredentials } = require('../shared/env');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function createTempWorkspace() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-electron-e2e-'));
  const workspaceRoot = path.join(tmpRoot, 'cwm-workspace');
  fs.mkdirSync(path.join(workspaceRoot, 'data', 'storage'), { recursive: true });
  fs.mkdirSync(path.join(workspaceRoot, 'ssl'), { recursive: true });
  return { tmpRoot, workspaceRoot };
}

function writeDesktopSettings(tmpRoot, workspaceRoot) {
  fs.writeFileSync(
    path.join(tmpRoot, 'desktop-settings.json'),
    JSON.stringify({ workspaceRoot, workspaceSetupComplete: true }, null, 2),
    { encoding: 'utf8', mode: 0o600 }
  );
}

async function launchDesktop(tmpRoot) {
  return electron.launch({
    args: [
      'apps/desktop',
      '--no-sandbox',
      `--user-data-dir=${path.join(tmpRoot, 'electron-user-data')}`,
    ],
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      CWM_PORTABLE_APP_ROOT: tmpRoot,
      NODE_ENV: 'test',
    },
    timeout: 45000,
  });
}

async function seedRenderer(window) {
  const credentials = getCredentials();
  const host = getCmsTarget();
  const result = await window.evaluate(async ({ credentials: account, host: cmsHost }) => {
    const request = async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { ok: response.ok, status: response.status, body };
    };

    const registration = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ id: account.username, password: account.password }),
    });
    if (!registration.ok && registration.status !== 400 && registration.status !== 409) {
      return { stage: 'register', response: registration };
    }

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ id: account.username, password: account.password }),
    });
    const token = login.body?.token || login.body?.data?.token;
    if (!login.ok || !token) return { stage: 'login', response: login };

    const hosts = await request('/api/host', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!hosts.ok) return { stage: 'list-hosts', response: hosts };

    const groups = hosts.body?.host_groups || hosts.body?.data?.host_groups || {};
    const exists = Object.values(groups).some((group) =>
      Object.values(group?.hosts || {}).some(
        (saved) => saved.address === cmsHost.address && Number(saved.port) === cmsHost.port
      )
    );

    if (!exists) {
      const added = await request('/api/host', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(cmsHost),
      });
      if (!added.ok) return { stage: 'add-host', response: added };
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.setItem('cwm-ui-locale', 'en');
    window.location.hash = '#/login';
    return { stage: 'complete' };
  }, { credentials, host });

  if (result.stage !== 'complete') {
    throw new Error(`Failed to seed Electron E2E data at ${result.stage}: ${JSON.stringify(result.response)}`);
  }
  await window.waitForURL(/#\/login$/, { timeout: 15000 });
  return credentials;
}

const test = base.extend({
  electronApp: async ({}, use) => {
    const { tmpRoot, workspaceRoot } = createTempWorkspace();
    writeDesktopSettings(tmpRoot, workspaceRoot);
    let app;
    try {
      app = await launchDesktop(tmpRoot);
      await use(app);
    } finally {
      await app?.close().catch(() => undefined);
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  },

  freshElectronApp: async ({}, use) => {
    const { tmpRoot } = createTempWorkspace();
    let app;
    try {
      app = await launchDesktop(tmpRoot);
      await use(app);
    } finally {
      await app?.close().catch(() => undefined);
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await use(window);
  },

  seededWindow: async ({ window }, use) => {
    await seedRenderer(window);
    await use(window);
  },

  appPage: async ({ seededWindow }, use) => {
    await use(seededWindow);
  },
});

module.exports = { test, expect, seedRenderer };
