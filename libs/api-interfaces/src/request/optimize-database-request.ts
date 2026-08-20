/**
 * Client request type for optimizing a database.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type OptimizeDatabaseRequest = {
  /**
   * Optional: Class name to optimize.
   * If provided, only the specified class will be optimized.
   * If not provided, the entire database will be optimized.
   */
  classname?: string;

  /**
   * Optional: DBA credentials — required when the database is online.
   * CMS authorizes optimizedb (and check/compact) against a per-connection
   * credential cache ("conlist") populated by a prior dbmtuserlogin call,
   * not from this request's own fields. If provided, the server logs in
   * first so the cache is populated before running the operation.
   */
  dbuser?: string;
  dbpasswd?: string;
};
