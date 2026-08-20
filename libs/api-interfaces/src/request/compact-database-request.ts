/**
 * Client request type for compacting a database.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type CompactDatabaseRequest = {
  /**
   * Verbose option - 'y' to include log output, 'n' to exclude
   */
  verbose: 'y' | 'n';

  /**
   * Optional: DBA credentials — required when the database is online.
   * See OptimizeDatabaseRequest for why (CMS's per-connection "conlist" cache).
   */
  dbuser?: string;
  dbpasswd?: string;
};
