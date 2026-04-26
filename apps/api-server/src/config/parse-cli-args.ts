/**
 * Parses `--KEY=value` style arguments (value may contain `=`).
 */
export function parseCliArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const body = arg.slice(2);
    const eq = body.indexOf('=');
    if (eq <= 0) continue;
    const key = body.slice(0, eq);
    const value = body.slice(eq + 1);
    result[key] = value;
  }
  return result;
}
