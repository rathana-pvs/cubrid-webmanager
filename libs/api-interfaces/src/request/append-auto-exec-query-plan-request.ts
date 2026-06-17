import { QueryPlanClient } from './set-auto-exec-query-client-request';

/**
 * Client request type for appending a single query plan to a database's auto-exec plan list.
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type AppendAutoExecQueryPlanRequest = {
  /**
   * Database name
   */
  dbname: string;

  /**
   * The query plan entry to append
   */
  plan: QueryPlanClient;
};
