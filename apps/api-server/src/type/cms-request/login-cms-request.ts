import { BaseCmsRequest } from './base-cms-request';

/**
 * Represents a CMS login request. It extends BaseCmsRequest but omits the token,
 * as the token is typically obtained after a successful login.
 *
 * @category Requests
 * @since 1.0.0
 */
export type LoginCmsRequest = Omit<BaseCmsRequest, 'token'> & {
  host?: string;
  port?: string;
  id: string;
  password: string;
  /** Protocol-shaped field only; unlike version fields in responses, CMS does not treat this meaningfully. */
  clientver?: string;
};
