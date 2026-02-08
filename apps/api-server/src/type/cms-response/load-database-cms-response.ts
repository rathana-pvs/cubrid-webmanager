import { BaseCmsResponse } from './base-cms-response';

/**
 * Response type for loaddb task.
 *
 * @category CMS Responses
 * @since 1.0.0
 */
export type LoadDatabaseCmsResponse = BaseCmsResponse & {
  /**
   * Array of log lines from the loaddb process.
   * Contains progress messages, errors, and completion status.
   *
   * Example:
   * [
   *   "",
   *   "Start schema loading.",
   *   "Total       14 statements executed.",
   *   "Schema loading from /path/to/schema finished.",
   *   "Start object loading.",
   *   "Total 0 object(s) inserted, 0 object(s) failed."
   * ]
   */
  line: string[];
};
