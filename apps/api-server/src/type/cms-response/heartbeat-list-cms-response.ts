import { BaseCmsResponse } from './base-cms-response';

export type HaDbModeItem = {
  dbname: string;
  server_mode: string;
  server_msg: string;
};

export type HaDbProcInfoItem = {
  dbname: string;
  pid: string;
  state: string;
};

export type HaApplyLogElementItem = {
  dbname: string;
  hostname: string;
  logpath: string;
  pid: string;
  state: string;
};

export type HaCopyLogElementItem = {
  dbname: string;
  hostname: string;
  logpath: string;
  mode: string;
  pid: string;
  state: string;
};

export type HaServerItem = {
  applylogdb?: Array<{ element: HaApplyLogElementItem[] }>;
  copylogdb?: Array<{ element: HaCopyLogElementItem[] }>;
  dbmode?: HaDbModeItem[];
  dbprocinfo?: HaDbProcInfoItem[];
};

export type HaNodeItem = {
  hostname: string;
  ip: string;
  priority: string;
  state: string;
};

/**
 * CMS response for heartbeatlist task.
 */
export type HeartbeatListCmsResponse = BaseCmsResponse & {
  task: 'heartbeatlist';
  currentnode?: string;
  currentnodestate?: string;
  hadbinfolist?: Array<{ server: HaServerItem[] }> | Record<string, never>;
  hanodelist?: Array<{ node: HaNodeItem[] }>;
};

