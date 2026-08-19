import { QueryPlanClient } from './set-auto-exec-query-client-request';

/**
 * Client request type for replacing a single existing query plan (by query_id)
 * in a database's auto-exec plan list.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type UpdateAutoExecQueryPlanRequest = {
  /**
   * Database name
   */
  dbname: string;

  /**
   * The replacement query plan entry. Its query_id identifies which existing
   * entry to replace.
   */
  plan: QueryPlanClient;
};
