import { HostInfo } from '@type/host-info';

/**
 * Request interface for updating an existing host.
 *
 * Contains host information without UID (UID is provided in URL parameter).
 * Includes password as it may need to be updated.
 *
 * @category Requests
 * @since 1.0.0
 */

export type UpdateHostRequest = Omit<HostInfo, 'uid' | 'initialLogin'>;
