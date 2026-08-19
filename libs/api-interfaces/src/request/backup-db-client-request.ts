/**
 * Client request type for backupdb (execute database backup).
 *
 * @category Client Requests
 * @since 1.0.0
 */
export type BackupDbClientRequest = {
  /** Backup level: 0, 1, or 2 */
  level: '0' | '1' | '2';
  /** Backup directory path */
  backupdir: string;
  /** Remove log after backup: 'y' | 'n' */
  removelog?: 'y' | 'n';
  /** Check option: 'y' | 'n' */
  check?: 'y' | 'n';
  /** Multi-thread count (e.g. '2') */
  mt?: string;
  /** Zip compression: 'y' | 'n' */
  zip?: 'y' | 'n';
  /** Safe replication: 'y' | 'n' */
  safereplication?: 'y' | 'n';
};
