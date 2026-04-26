import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { parseCliArgs } from './parse-cli-args';

/**
 * Loads env before Nest bootstrap (pkg-aware base dir).
 * - production: `/etc/cubrid-webmanager.env` -> `apps/api-server/.env` -> root `.env` (local fallback)
 * - non-production: root `.env` -> `apps/api-server/.env`
 * Does not override variables already set (e.g. systemd EnvironmentFile).
 */
export function loadRuntimeEnv(): void {
  const args = parseCliArgs(process.argv.slice(2));
  const rawMode = (
    args.ENV ??
    args.ENVIRONMENT ??
    process.env.ENVIRONMENT ??
    'development'
  ).toLowerCase();
  const isProduction = rawMode === 'production';
  const isPkg = !!(process as any).pkg;
  const baseDir = isPkg ? path.dirname(process.execPath) : process.cwd();

  const candidates: string[] = [];
  if (isProduction) {
    candidates.push('/etc/cubrid-webmanager.env');
    candidates.push(path.join(baseDir, 'apps/api-server/.env'));
    candidates.push(path.join(baseDir, '.env'));
  } else {
    candidates.push(path.join(baseDir, '.env'));
    candidates.push(path.join(baseDir, 'apps/api-server/.env'));
  }

  const envFilePath = candidates.find((p) => fs.existsSync(p)) ?? null;
  if (!envFilePath) {
    console.warn(
      `[load-runtime-env] no env file found (tried: ${candidates.join(', ')}) - using existing process.env only.`
    );
    return;
  }

  loadEnv({ path: envFilePath, override: false });
}
