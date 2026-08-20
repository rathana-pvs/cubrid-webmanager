/**
 * Client request type for checking a database.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type CheckDatabaseRequest = {
  /**
   * Repair option - 'y' to repair, 'n' to check only
   */
  repairdb: 'y' | 'n';

  /**
   * Optional: DBA credentials — required when the database is online.
   * See OptimizeDatabaseRequest for why (CMS's per-connection "conlist" cache).
   */
  dbuser?: string;
  dbpasswd?: string;
};
