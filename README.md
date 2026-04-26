# CUBRID Web Manager

A modern web application for CUBRID database administration.

## Project Structure

```text
cubrid-webmanager/
├── apps/
│   ├── web-manager/      # React frontend
│   ├── api-server/       # NestJS backend
│   └── desktop-shell/    # Electron wrapper (future)
├── libs/
│   ├── cubrid-driver/    # Shared CUBRID access logic
│   ├── api-interfaces/   # Shared TypeScript interfaces
│   └── ui-components/    # Reusable UI components
├── nx.json
└── package.json
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Servers

#### Frontend (React)

```bash
nx serve web-manager
```

#### Backend (NestJS)

```bash
# Run with default values (SEED=seed, SALT=salt, PORT=8080)
nx serve api-server

# Run with custom CLI args
nx serve api-server --args="--SEED=myseed --SALT=mysalt --PORT=8081"

# Or use an Nx configuration
nx serve api-server --configuration=dev-with-port
```

Required API CLI args:
- `--SEED={string}`: encryption seed (required)
- `--SALT={string}`: encryption salt (required)
- `--PORT={number}`: server port (optional, default: 8080)

### Build

```bash
# Frontend
nx build web-manager

# Backend
nx build api-server
```

### Build Executables (`pkg`)

You can build single-file executables with `pkg`:

```bash
# Build for all platforms (Windows, Linux, macOS)
nx build:exe api-server --configuration=all

# Build for one platform
nx build:exe api-server --configuration=windows
nx build:exe api-server --configuration=linux
nx build:exe api-server --configuration=macos
```

Output files are generated in `dist/executables/`:
- Windows: `api-server.exe`
- Linux: `api-server-linux`
- macOS: `api-server-macos`

Run examples:

```bash
# Windows
dist/executables/api-server.exe --SEED=seed --SALT=salt --PORT=8080

# Linux
./dist/executables/api-server-linux --SEED=seed --SALT=salt --PORT=8080

# macOS
./dist/executables/api-server-macos --SEED=seed --SALT=salt --PORT=8080
```

Notes:
- `pkg` settings are defined in the root `package.json` (`pkg` field).
- Build settings are copied into the built `package.json`.
- To change targets, edit `pkg.targets` in root `package.json` or use Nx configurations.
- Webpack bundles dependencies, so executables run without a separate Node.js install.
- TypeScript path aliases are resolved at build time.

## Tech Stack

- Frontend: React 19, Vite, Ant Design, Redux Toolkit
- Backend: NestJS 11, TypeScript
- Monorepo: Nx 22.3.3

## Nx Monorepo Notes

This workspace uses a single root `package.json` to manage dependencies for all projects.

### Core Concepts

- Root `package.json`: central dependency management
- `project.json`: per-app/per-lib build and run config (not dependency definitions)
- Path aliases: TypeScript resolves aliases like `@api-interfaces`, `@auth`
- Bundling: webpack bundles code during build

### Why No `package.json` Per App?

Compared with multi-project repos that have one `package.json` per project, Nx here uses:
- single dependency management
- reduced duplication
- consistent package versions
- easy sharing through `libs/`

See [`docs/NX_STRUCTURE.md`](./docs/NX_STRUCTURE.md) for more details.
