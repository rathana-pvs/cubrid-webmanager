import { BaseCmsRequest } from './base-cms-request';

/**
 * Request type for optimizing a database.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type OptimizeDatabaseCmsRequest = BaseCmsRequest & {
  /**
   * Task type - must be 'optimizedb'
   */
  task: 'optimizedb';

  /**
   * Database name to optimize
   */
  dbname: string;

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
