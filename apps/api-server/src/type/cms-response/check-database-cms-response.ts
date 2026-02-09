import { BaseCmsResponse } from './base-cms-response';

/**
 * Response type for checkdb task.
 *
 * @category CMS Responses
 * @since 1.0.0
 */
export type CheckDatabaseCmsResponse = BaseCmsResponse & {
  /**
   * Task type - must be 'checkdb'
   */
  task: 'checkdb';
};
