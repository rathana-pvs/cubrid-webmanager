import { BaseCmsRequest } from './base-cms-request';

/**
 * CMS request for starting all brokers on a host.
 * Task: startbroker (no additional parameters).
 */
export type StartAllBrokersCmsRequest = BaseCmsRequest & {
  task: 'startbroker';
};
