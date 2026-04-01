/**
 * Formatting utilities for CUBRID Web Manager
 */

/**
 * Format bytes to human readable size
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format page-based size to human readable size
 * @param {number} pages 
 * @param {number} pageSize 
 * @returns {string}
 */
export const formatPagesToSize = (pages, pageSize) => {
  if (!pages || !pageSize) return '0 B';
  return formatSize(pages * pageSize);
};

/**
 * Format storage free space (KB to human readable)
 * @param {number|string} kb 
 * @returns {string}
 */
export const formatKBToSize = (kb) => {
  const val = typeof kb === 'string' ? parseInt(kb) : kb;
  if (isNaN(val)) return '—';
  return formatSize(val * 1024);
};

/**
 * Simple MB to GB/MB formatter
 * @param {number} mb 
 * @returns {string}
 */
export const formatMBToSize = (mb) => {
  if (!mb) return '0 MB';
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
};
