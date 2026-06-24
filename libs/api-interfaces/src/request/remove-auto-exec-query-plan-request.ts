/**
 * Client request type for removing a single query plan from a database's auto-exec plan list.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type RemoveAutoExecQueryPlanRequest = {
  /**
   * Database name
   */
  dbname: string;

  /**
   * The query_id of the plan entry to remove
   */
  query_id: string;
};
