import { BaseCmsRequest } from './base-cms-request';

/**
 * Request type for checkdb task.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type CheckDatabaseCmsRequest = BaseCmsRequest & {
  /**
   * Task type - must be 'checkdb'
   */
  task: 'checkdb';

  /**
   * Database name to check
   */
  dbname: string;

  /**
   * Repair option - 'y' to repair, 'n' to check only
   */
  repairdb: 'y' | 'n';
};

