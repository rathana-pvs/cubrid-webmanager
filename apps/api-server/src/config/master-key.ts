import * as crypto from 'crypto';

/**
 * Derives the AES-256 key (hex) from SEED and SALT using PBKDF2
 * (100_000 iterations, SHA-256, 32-byte output) — same as storage encryption key.
 */
export function deriveSecretKeyHexFromSeedSalt(seed: string, salt: string): string {
  return crypto.pbkdf2Sync(seed, salt, 100_000, 32, 'sha256').toString('hex');
}
