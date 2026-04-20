import { BaseCmsRequest } from './base-cms-request';

/**
 * Request for CMS `plandump` (query plan / XASL-related dump text).
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type PlandumpCmsRequest = BaseCmsRequest & {
  task: 'plandump';
  dbname: string;
};
