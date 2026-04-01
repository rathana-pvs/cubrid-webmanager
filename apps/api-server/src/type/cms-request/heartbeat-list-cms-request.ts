import { BaseCmsRequest } from './base-cms-request';

/**
 * CMS request for heartbeatlist task.
 */
export type HeartbeatListCmsRequest = BaseCmsRequest & {
  task: 'heartbeatlist';
  /**
   * Include DB mode information for all databases.
   * Typically "y" or "n".
   */
  dbmodeall: string;
};

