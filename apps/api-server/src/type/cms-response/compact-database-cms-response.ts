import { BaseCmsResponse } from './base-cms-response';

/**
 * Response type for compactdb task.
 *
 * @category CMS Responses
 * @since 1.0.0
 */
export type CompactDatabaseCmsResponse = BaseCmsResponse & {
  /**
   * Task type - must be 'compactdb'
   */
  task: 'compactdb';

  /**
   * Log output (only present when verbose is 'y')
   */
  log?: Array<{
    /**
     * Array of log lines
     */
    line: string[];
  }>;
};
