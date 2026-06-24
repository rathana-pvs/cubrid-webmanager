export type CmsJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type CmsJobType =
  | 'unload'
  | 'load'
  | 'create'
  | 'optimize'
  | 'check'
  | 'compact'
  | 'copy'
  | 'addvol'
  | 'rename';

/**
 * Returned when a long-running CMS operation is accepted (HTTP 202).
 */
export type CreateCmsJobResponse = {
  jobId: string;
};

/**
 * Job status polled by the client until terminal state.
 */
export type CmsJobStatusResponse = {
  jobId: string;
  type: CmsJobType;
  /** Job lifecycle (not HTTP status — avoids SuccessResponseInterceptor collision). */
  jobStatus: CmsJobStatus;
  hostUid: string;
  dbname: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: unknown;
  error?: { message: string; code?: string; cmsStatus?: string };
};
