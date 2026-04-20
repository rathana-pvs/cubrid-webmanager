import { BaseCmsRequest } from './base-cms-request';

/**
 * CMS `ha_reload` request body (`token` is merged in by `BaseService.executeCmsRequest`).
 */
export type HaReloadCmsRequest = BaseCmsRequest & {
  task: 'ha_reload';
};
