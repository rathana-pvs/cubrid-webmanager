import { BaseCmsRequest } from './base-cms-request';

/**
 * Request type for backupdb task.
 *
 * @category CMS Requests
 * @since 1.0.0
 */
export type BackupDbCmsRequest = BaseCmsRequest & {
  task: 'backupdb';
  dbname: string;
  level: '0' | '1' | '2';
  backupdir: string;
  volname: string;
  removelog: 'y' | 'n';
  check: 'y' | 'n';
  mt: string;
  zip: 'y' | 'n';
  safereplication: 'y' | 'n';
};
