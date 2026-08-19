import { BaseCmsResponse } from './base-cms-response';

/**
 * CMS response for startbroker task.
 */
export type StartAllBrokersCmsResponse = BaseCmsResponse & {
  task: 'startbroker';
};
