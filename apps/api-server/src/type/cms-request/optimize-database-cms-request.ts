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
   * Optional: Class name to optimize.
   * If provided, only the specified class will be optimized.
   * If not provided, the entire database will be optimized.
   */
  classname?: string;
};
