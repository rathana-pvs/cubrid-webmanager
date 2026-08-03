const { test: base, _electron: electron, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function createTempWorkspace() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cwm-electron-e2e-'));
  const workspaceDir = path.join(tmpRoot, 'cwm-workspace');
  fs.mkdirSync(path.join(workspaceDir, 'data', 'storage'), { recursive: true });
  fs.mkdirSync(path.join(workspaceDir, 'ssl'), { recursive: true });
  return {
    tmpRoot,
    workspaceDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors on process exit
      }
    },
  };
}

function writeSettingsFile(portableRoot, workspaceRoot, setupComplete = true) {
  const settings = {
    workspaceRoot,
    workspaceSetupComplete: setupComplete,
  };
  fs.writeFileSync(
    path.join(portableRoot, 'desktop-settings.json'),
    JSON.stringify(settings, null, 2),
    { encoding: 'utf8', mode: 0o600 }
  );
}

const test = base.extend({
  // Default fixture: pre-configured workspace, skips setup wizard, boots embedded API
  electronApp: async ({}, use) => {
    const { tmpRoot, workspaceDir, cleanup } = createTempWorkspace();
    writeSettingsFile(tmpRoot, workspaceDir, true);

    const app = await electron.launch({
      args: ['apps/desktop', '--no-sandbox'],
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        CWM_PORTABLE_APP_ROOT: tmpRoot,
        NODE_ENV: 'test',
      },
      timeout: 45000,
    });

    await use(app);
    await app.close();
    cleanup();
  },

  // First-time launch fixture: no settings file present, setup wizard required
  freshElectronApp: async ({}, use) => {
    const { tmpRoot, cleanup } = createTempWorkspace();

    const app = await electron.launch({
      args: ['apps/desktop', '--no-sandbox'],
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        CWM_PORTABLE_APP_ROOT: tmpRoot,
        NODE_ENV: 'test',
      },
      timeout: 45000,
    });

    await use(app);
    await app.close();
    cleanup();
  },

  window: async ({ electronApp }, use) => {
    const win = await electronApp.firstWindow();
    await win.waitForLoadState('domcontentloaded');
    await use(win);
  },
});

module.exports = { test, expect };
