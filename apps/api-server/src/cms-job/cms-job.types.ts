import {
  AddVolDbRequest,
  CheckDatabaseRequest,
  CompactDatabaseRequest,
  CopyDbRequest,
  CreateDatabaseWithConfigRequest,
  CmsJobStatus,
  CmsJobType,
  LoadDatabaseRequest,
  OptimizeDatabaseRequest,
  RenameDatabaseRequest,
  UnloadDatabaseRequest,
} from '@api-interfaces';

export type CmsJobPayload =
  | UnloadDatabaseRequest
  | LoadDatabaseRequest
  | CreateDatabaseWithConfigRequest
  | OptimizeDatabaseRequest
  | CheckDatabaseRequest
  | CompactDatabaseRequest
  | CopyDbRequest
  | AddVolDbRequest
  | RenameDatabaseRequest;

export type CmsJobRecord = {
  jobId: string;
  userId: string;
  hostUid: string;
  dbname: string;
  type: CmsJobType;
  status: CmsJobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  payload: CmsJobPayload;
  result?: unknown;
  error?: { message: string; code?: string; cmsStatus?: string };
};

export function buildOperationKey(userId: string, hostUid: string, dbname: string): string {
  return JSON.stringify([userId, hostUid, dbname]);
}

export function resolveJobDbname(type: CmsJobType, dbname: string, payload: CmsJobPayload): string {
  if (type === 'copy') {
    return (payload as CopyDbRequest).destdbname;
  }
  return dbname;
}
