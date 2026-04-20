import { BaseCmsResponse } from './base-cms-response';
import { LogContentContainer } from './view-log-cms-response';

/**
 * CMS response for `plandump`.
 * Text is split across `log[].line[]` like `viewlog`.
 *
 * @category CMS Responses
 * @since 1.0.0
 */
export type PlandumpCmsResponse = BaseCmsResponse & {
  task: 'plandump';
  log: LogContentContainer[];
};
