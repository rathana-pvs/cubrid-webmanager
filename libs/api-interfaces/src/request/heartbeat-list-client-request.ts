/**
 * Client request type for heartbeatlist task.
 */
export type HeartbeatListClientRequest = {
  /**
   * Include DB mode information for all databases.
   * Usually "y" or "n".
   */
  dbmodeall: string;
};

