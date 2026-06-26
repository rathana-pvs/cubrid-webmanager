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
};
