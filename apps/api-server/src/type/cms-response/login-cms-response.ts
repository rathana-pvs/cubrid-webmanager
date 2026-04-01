import type { BaseCmsResponse } from './base-cms-response';

/**
 * CMS response for task `login` (cm_api).
 * On failure, `status` is `fail` and `token` may be absent.
 *
 * @category Responses
 * @since 1.0.0
 */
export type LoginCmsResponse = BaseCmsResponse & {
  token?: string;
};
