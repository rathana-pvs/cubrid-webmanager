import { BaseCmsRequest } from './base-cms-request';

/**
 * Request type for compactdb task.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type CompactDatabaseCmsRequest = BaseCmsRequest & {
  /**
   * Task type - must be 'compactdb'
   */
  task: 'compactdb';

  /**
   * Database name to compact
   */
  dbname: string;

  /**
   * Verbose option - 'y' to include log output, 'n' to exclude
   */
  verbose: 'y' | 'n';
};
