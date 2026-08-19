// backupDir must resolve to the same directory for every level (CMS's
// cub_server names the actual backup file itself: dbname_bk{level}v{unit}).
// This is required for restoredb's single -B argument to find all levels
// of a multi-level restore chain in one place. api-server appends a fixed,
// level-independent volname (see database-backup.service.ts) so the actual
// backup location is backupDir/{dbname}_backup regardless of level.

// Strip all trailing /backup segments then re-append one canonical /backup.
// Handles cases like /home/db/backup/backup or /home/db/backup/ from CMS.
export function deriveBackupDir(dbdir) {
  if (!dbdir) return '';
  return `${dbdir.replace(/(?:\/backup)+\/?$/, '')}/backup`;
}
