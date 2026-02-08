import { BaseCmsResponse } from './base-cms-response';

/**
 * Response type for optimizedb task.
 *
 * @category CMS Responses
 * @since 1.0.0
 */
export type OptimizeDatabaseCmsResponse = BaseCmsResponse & {
  /**
   * Task type - must be 'optimizedb'
   */
  task: 'optimizedb';
};
