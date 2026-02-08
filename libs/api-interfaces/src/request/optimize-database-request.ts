/**
 * Client request type for optimizing a database.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type OptimizeDatabaseRequest = {
  /**
   * Optional: Array of class objects to optimize.
   * If provided, only the specified classes will be optimized.
   * If not provided, the entire database will be optimized.
   */
  class?: Array<{
    /**
     * Class name to optimize
     */
    classname: string;
  }>;
};
