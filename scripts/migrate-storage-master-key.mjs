#!/usr/bin/env node
/**
 * Re-encrypts api-server storage when rotating SEED/SALT (or migrating off raw MASTER_KEY).
 *
 * Old key (one of):
 *   --old-seed + --old-salt   (PBKDF2, same as app)
 *   --old-master-key          (64 hex or Base64×32; only if data was encrypted with a prior MASTER_KEY build)
 *
 * New key (one of):
 *   --new-seed + --new-salt   (PBKDF2, same as app — preferred)
 *   --new-master-key          (64 hex or Base64×32; only if target app reads raw key — current app uses SEED/SALT)
 *
 * Usage:
 *   node scripts/migrate-storage-master-key.mjs --storage=./storage \
 *     --old-seed=... --old-salt=... --new-seed=... --new-salt=...
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const body = arg.slice(2);
    const eq = body.indexOf('=');
    if (eq <= 0) continue;
    out[body.slice(0, eq)] = body.slice(eq + 1);
  }
  return out;
}

function parseMasterKeyToHex(raw) {
  const v = String(raw).trim();
  if (!v) throw new Error('empty key');
  if (/^[0-9a-fA-F]{64}$/.test(v)) return v.toLowerCase();
  const buf = Buffer.from(v, 'base64');
  if (buf.length === 32) return buf.toString('hex');
  throw new Error('key must be 64 hex chars or Base64 of 32 bytes');
}

function derivePbkdf2Hex(seed, salt) {
  return crypto.pbkdf2Sync(seed, salt, 100_000, 32, 'sha256').toString('hex');
}

const algorithm = 'aes-256-cbc';

function decryptValue(cipher, keyHex) {
  const [ivHex, encryptedHex] = cipher.split(':');
  if (!ivHex || !encryptedHex) throw new Error('invalid cipher format');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function encryptValue(plain, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const storageDir = args.storage;
  if (!storageDir) {
    console.error('Missing --storage=/path/to/storage');
    process.exit(1);
  }

  let newKeyHex;
  if (args['new-seed'] != null && args['new-salt'] != null) {
    newKeyHex = derivePbkdf2Hex(args['new-seed'], args['new-salt']);
  } else if (args['new-master-key']) {
    newKeyHex = parseMasterKeyToHex(args['new-master-key']);
  } else {
    console.error('Provide --new-seed=... and --new-salt=... (or --new-master-key=... for special cases).');
    process.exit(1);
  }

  let oldKeyHex;
  if (args['old-master-key']) {
    oldKeyHex = parseMasterKeyToHex(args['old-master-key']);
  } else if (args['old-seed'] != null && args['old-salt'] != null) {
    oldKeyHex = derivePbkdf2Hex(args['old-seed'], args['old-salt']);
  } else {
    console.error('Provide --old-master-key=... or --old-seed=... and --old-salt=...');
    process.exit(1);
  }

  if (oldKeyHex === newKeyHex) {
    console.log('Old and new keys are identical; nothing to do.');
    return;
  }

  const abs = path.resolve(storageDir);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  let n = 0;
  for (const name of files) {
    if (name.endsWith('.tmp') || name.startsWith('.')) continue;
    const fp = path.join(abs, name);
    const raw = await fs.readFile(fp, 'utf-8');
    if (!raw.trim()) continue;
    const plain = decryptValue(raw, oldKeyHex);
    const enc = encryptValue(plain, newKeyHex);
    await fs.writeFile(fp, enc, 'utf-8');
    n++;
    console.log('Migrated', name);
  }
  console.log(`Done. ${n} file(s) re-encrypted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
