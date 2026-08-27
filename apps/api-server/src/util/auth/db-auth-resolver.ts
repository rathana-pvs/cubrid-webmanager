import { HostInfo } from '@type/index';
import { ValidationError } from '@error/validation/validation-error';

/**
 * Resolved database authentication information from profile or client-provided credentials.
 */
export interface ResolvedDBAuth {
  dbname: string;
  id: string;
  password: string;
}

/**
 * Utility service for resolving database authentication information.
 *
 * - If profile exists: Gets id/password from HostInfo's dbProfiles.
 * - If profile doesn't exist: Uses id/password provided by the client.
 *
 * @category Utilities
 * @since 1.0.0
 */
export class DBAuthResolver {
  /**
   * Resolves database authentication information from host profile or client-provided credentials.
   *
   * @param host - Host information containing dbProfiles
   * @param dbname - Database name
   * @param clientId - Client-provided database user ID (required if profile doesn't exist)
   * @param clientPassword - Client-provided database password (required if profile doesn't exist)
   * @returns ResolvedDBAuth containing dbname, id, and password
   * @throws ValidationError.MissingDBCredentials if profile doesn't exist and client credentials are not provided
   *
   * @example
   * ```typescript
   * // When profile exists
   * const auth = DBAuthResolver.resolve(host, 'mydb');
   *
   * // When profile doesn't exist
   * const auth = DBAuthResolver.resolve(host, 'mydb', 'dbuser', 'dbpass');
   * ```
   */
  static resolve(
    host: HostInfo,
    dbname: string,
    clientId?: string,
    clientPassword?: string
  ): ResolvedDBAuth {
    if (clientId != null && clientPassword != null) {
      return {
        dbname,
        id: clientId,
        password: clientPassword,
      };
    }

    const dbProfiles = host.dbProfiles || {};
    const profile = dbProfiles[dbname];

    if (profile) {
      return {
        dbname,
        id: profile.id,
        password: profile.password,
      };
    }

    const missingFields: string[] = [];
    if (clientId == null) missingFields.push('id');
    if (clientPassword == null) missingFields.push('password');

    throw ValidationError.MissingDBCredentials(dbname, missingFields);
  }

  /**
   * Checks if a database profile exists for the given dbname.
   *
   * @param host - Host information containing dbProfiles
   * @param dbname - Database name
   * @returns true if profile exists, false otherwise
   */
  static hasProfile(host: HostInfo, dbname: string): boolean {
    return !!(host.dbProfiles && host.dbProfiles[dbname]);
  }
}
