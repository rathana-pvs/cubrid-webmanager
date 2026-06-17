import { BaseCmsRequest } from './base-cms-request';

/**
 * Query plan for auto-execution.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type QueryPlan = {
  /**
   * Query ID
   */
  query_id: string;

  /**
   * Username for query execution
   */
  username: string;

  /**
   * User password (optional, can be empty)
   */
  userpass?: string;

  /**
   * Period type (e.g., 'MONTH', 'WEEK', 'DAY')
   */
  period: string;

  /**
   * Schedule detail (e.g., '1,20 12:30' for day 1 and 20 at 12:30)
   */
  detail: string;

  /**
   * SQL query string
   */
  query_string: string;
};

/**
 * Plan list container.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type PlanList = {
  /**
   * Database name
   */
  dbname: string;

  /**
   * Query plans array
   */
  queryplan: QueryPlan[];
};

/**
 * Request type for setting auto-execution query.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type SetAutoExecQueryCmsRequest = BaseCmsRequest & {
  /**
   * Task type - must be 'setautoexecquery'
   */
  task: 'setautoexecquery';

  /**
   * Database name
   */
  dbname: string;

  /**
   * Plan list containing query plans
   */
  planlist: PlanList[];
};
