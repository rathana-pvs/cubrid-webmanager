const TYPE_KEYS = {
  unload: 'jobTypeUnload',
  load: 'jobTypeLoad',
  create: 'jobTypeCreate',
  optimize: 'jobTypeOptimize',
  check: 'jobTypeCheck',
  compact: 'jobTypeCompact',
  copy: 'jobTypeCopy',
  addvol: 'jobTypeAddVol',
  rename: 'jobTypeRename',
  backupdb: 'jobTypeBackupDb',
};

export function getCmsJobTypeLabel(type, CM) {
  const key = TYPE_KEYS[type];
  return key && CM[key] ? CM[key] : type || 'Job';
}

export function getCmsJobStatusLabel(status, CM) {
  switch (status) {
    case 'queued':
      return CM.jobStatusQueued;
    case 'running':
      return CM.jobStatusRunning;
    case 'succeeded':
      return CM.jobStatusSucceeded;
    case 'failed':
      return CM.jobStatusFailed;
    default:
      return status || '—';
  }
}

export function isTerminalCmsJobStatus(status) {
  return status === 'succeeded' || status === 'failed';
}
