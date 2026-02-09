/**
 * Client request type for getting class information.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type ClassInfoRequest = {
  /**
   * Database status
   * Values: "on" | "off"
   */
  dbstatus: 'on' | 'off';
};
