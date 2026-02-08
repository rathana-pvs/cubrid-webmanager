/**
 * Client request type for loading a database.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type LoadDatabaseRequest = {
  /**
   * Check option
   * Values: "both" | "none" | other values
   */
  checkoption: string;

  /**
   * Period
   * Values: "none" | other values
   */
  period: string;

  /**
   * Database user
   */
  user: string;

  /**
   * Estimated
   * Values: "none" | other values
   */
  estimated: string;

  /**
   * OID use
   * Values: "yes" | "no"
   */
  oiduse: 'yes' | 'no';

  /**
   * Statistics use
   * Values: "yes" | "no"
   */
  statisticsuse: 'yes' | 'no';

  /**
   * No log
   * Values: "yes" | "no"
   */
  nolog: 'yes' | 'no';

  /**
   * Schema file path
   */
  schema: string;

  /**
   * Object file path
   */
  object: string;

  /**
   * Index
   * Values: "none" | other values
   */
  index: string;

  /**
   * Error control file
   * Values: "none" | file path
   */
  errorcontrolfile: string;

  /**
   * Ignore class file
   * Values: "none" | file path
   */
  ignoreclassfile: string;
};
