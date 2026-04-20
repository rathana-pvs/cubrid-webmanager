import { BaseCmsResponse } from './base-cms-response';

/**
 * CMS success envelope for `ha_reload` (no extra domain fields beyond standard CMS fields).
 */
export type HaReloadCmsResponse = BaseCmsResponse & {
  task: 'ha_reload';
};
