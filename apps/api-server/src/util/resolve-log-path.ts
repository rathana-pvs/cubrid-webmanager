import * as path from 'path';

/**
 * Determines the appropriate log directory based on the execution environment.
 * If running as a `pkg` executable, it uses the executable's directory.
 * Otherwise (development mode), it uses the project's root directory.
 * Mirrors `resolve-storage-path.ts`'s pkg/dev fallback logic.
 *
 * @returns The absolute path to the log directory.
 * @category Utilities
 * @since 1.0.0
 */
export function getLogPath(): string {
  const configuredPath = process.env.LOG_DIR?.trim();
  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const isPkg = !!(process as any).pkg;

  if (isPkg) {
    const executableDir = path.dirname(process.execPath);
    return path.join(executableDir, 'logs');
  } else {
    return path.resolve(__dirname, '..', '..', 'logs');
  }
}
