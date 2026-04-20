import { HostInfo } from './host-info';
import { HashMap } from './collections';
import { UserPreference } from './user-preferencs';

/**
 * User interface representing a user in the system.
 *
 * Contains user information including authentication details,
 * department, and associated host lists.
 *
 * @category Types
 * @since 1.0.0
 */
export interface User {
  uuid: string;
  id: string;
  password: string;
  department: string;
  host_list: HashMap<HostInfo>;
  ha_mon_list: HashMap<any>;
  resource_mon_list: HashMap<any>;
  user_preference: UserPreference;
}
