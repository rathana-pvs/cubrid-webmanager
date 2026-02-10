/**
 * Client response type for compacting a database.
 * Returns domain-only data (CMS envelope removed).
 *
 * @category Client Responses
 * @since 1.0.0
 */
export type CompactDatabaseResponse = {
  /**
   * Log output (only present when verbose is 'y')
   */
  log?: Array<{
    /**
     * Array of log lines
     */
    line: string[];
  }>;
};
