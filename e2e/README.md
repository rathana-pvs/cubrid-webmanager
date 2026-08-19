# Cross-platform end-to-end tests

The React renderer is tested from one shared suite against two real runtimes:

- `web`: Playwright Chromium connected to a running Web Manager stack.
- `electron`: Playwright Electron connected to the desktop `app://` renderer and embedded API.

The shared specs use the `appPage` fixture. In web mode it is a browser `Page`; in Electron mode it is the first renderer window. Page objects must not depend on how the runtime was launched.

## Layout

```text
e2e/
├── shared/
│   ├── fixture.js
│   ├── pages/
│   └── tests/
├── web/
│   ├── fixture.js
│   └── playwright.config.js
├── electron/
│   ├── fixture.js
│   ├── pages/
│   ├── helpers/
│   ├── tests/
│   └── *.playwright.config.js
└── docs/
```

## Configuration

Copy `e2e/.env.example` to `e2e/.env`. Both runtimes use the same CMS target and database. Web mode requires `E2E_USERNAME`, `E2E_PASSWORD`, and an explicit `E2E_HOST_PASSWORD`; Electron creates that account and host record inside each isolated temporary workspace. `npm run e2e:web` seeds the account, repairs the configured target's saved credential, and removes duplicate records for that exact address, port, and CMS user before starting Playwright.

The CMS target is real. A missing or unreachable CMS causes dependent tests to fail. It is never converted into a body-level smoke assertion.

## Commands

```bash
npm run e2e:web
npm run e2e:shared:electron
npm run e2e:electron:platform
npm run e2e:electron:packaged
npm run e2e:electron
npm run e2e:all
```

Start the web/API stack before `e2e:web`. Electron commands rebuild desktop, API, and renderer artifacts before execution.
The packaged command builds and launches the platform executable, checks the embedded renderer/API files, and calls the packaged protocol proxy.

CI validates discovery on every push and pull request. The manual **Real cross-platform E2E** workflow runs serially on a Linux self-hosted runner that can reach the configured CMS; it seeds the local API, executes Chromium and Electron, optionally checks the packaged executable, and uploads failure artifacts.

## Test rules

1. Shared UI behavior belongs in `shared/tests`, not in a duplicated Electron spec.
2. Electron-only tests cover workspace setup, protocol proxying, preload/IPC, shortcuts, and window lifecycle.
3. Feature tests assert the requested UI and resulting state. `body`, `#app`, or a generic container is not an acceptable fallback.
4. Optional environment behavior uses `test.skip(true, reason)`, never an annotation followed by a successful return.
5. Destructive operations use unique names and restore or remove the affected CMS state.
6. A missing prerequisite fails during setup unless the test explicitly documents a legitimate environment limitation.

See [COVERAGE_MATRIX.md](./docs/COVERAGE_MATRIX.md) for the legacy-to-current mapping.
