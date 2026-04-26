import { Injectable } from '@nestjs/common';
import { parseCliArgs } from './parse-cli-args';
import { deriveSecretKeyHexFromSeedSalt } from './master-key';

/**
 * Application configuration from env (after `loadRuntimeEnv`) with optional CLI overrides.
 * Encryption key: PBKDF2(SEED, SALT) — set `SEED` and `SALT` in env or `/etc/cubrid-webmanager.env`.
 *
 * @category Infrastructure Services
 * @since 1.0.0
 */
@Injectable()
export class ConfigService {
  public port: string = '8080';
  public secret_key!: string;
  public environment: string = 'development';
  public allowedOrigins: string[] = [];

  constructor() {
    const args = parseCliArgs(process.argv.slice(2));

    const seed = args.SEED ?? process.env.SEED;
    const salt = args.SALT ?? process.env.SALT;
    if (!seed || !salt) {
      throw new Error(
        'SEED and SALT are required (env or CLI, e.g. SEED=... SALT=... in .env).'
      );
    }
    this.secret_key = deriveSecretKeyHexFromSeedSalt(seed, salt);

    if (args.PORT) {
      const portNumber = parseInt(args.PORT, 10);
      if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
        throw new Error(
          `Invalid PORT provided: "${args.PORT}". Port must be a number between 1 and 65535.`
        );
      }
      this.port = args.PORT;
    } else if (process.env.PORT) {
      const portNumber = parseInt(process.env.PORT, 10);
      if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
        throw new Error(
          `Invalid PORT in environment: "${process.env.PORT}". Port must be a number between 1 and 65535.`
        );
      }
      this.port = process.env.PORT;
    } else {
      this.port = '8080';
    }

    this.environment = (
      args.ENVIRONMENT ??
      args.ENV ??
      process.env.ENVIRONMENT ??
      'development'
    ).toLowerCase();
    console.log('[ConfigService] Environment:', this.environment);

    const allowedFromEnvOrArg =
      args.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGINS;
    this.setAllowedOrigins(allowedFromEnvOrArg);
  }

  getSecretKey(): string {
    return this.secret_key;
  }

  getPort(): string {
    return this.port;
  }

  getEnvironment(): string {
    return this.environment;
  }

  getAllowedOrigins(): string[] {
    return this.allowedOrigins;
  }

  private setAllowedOrigins(allowedOrigins?: string): void {
    if (this.environment === 'production') {
      if (allowedOrigins) {
        this.allowedOrigins = allowedOrigins.split(',').map((s) => s.trim());
      } else {
        this.allowedOrigins = [];
      }
    } else {
      this.allowedOrigins = ['*'];
    }
    console.log('[ConfigService] Allowed Origins:', this.allowedOrigins);
  }
}
