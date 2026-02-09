import { BaseCmsRequest } from './base-cms-request';

/**
 * Request type for classinfo task.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type ClassInfoCmsRequest = BaseCmsRequest & {
  /**
   * Task type - must be 'classinfo'
   */
  task: 'classinfo';

  /**
   * Database name
   */
  dbname: string;

  /**
   * Database status
   * Values: "on" | "off"
   */
  dbstatus: 'on' | 'off';
};
