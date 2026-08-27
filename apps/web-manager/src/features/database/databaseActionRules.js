/**
 * Database Action Rules & Permission Helpers
 * Modeled after CUBRID Manager (Eclipse RCP) ActionSupportUtil
 */

export const DB_ACTIONS = {
  START_DB: 'START_DB',
  STOP_DB: 'STOP_DB',
  DELETE_DB: 'DELETE_DB',
  RENAME_DB: 'RENAME_DB',
  COPY_DB: 'COPY_DB',
  RESTORE_DB: 'RESTORE_DB',
  OPTIMIZE_DB: 'OPTIMIZE_DB',
  LOAD_DB: 'LOAD_DB',
  UNLOAD_DB: 'UNLOAD_DB',
  BACKUP_DB: 'BACKUP_DB',
  CHECK_DB: 'CHECK_DB',
  COMPACT_DB: 'COMPACT_DB',
  LOCK_INFO: 'LOCK_INFO',
  PLAN_DUMP: 'PLAN_DUMP',
  PARAM_DUMP: 'PARAM_DUMP',
  TRANSACTION_INFO: 'TRANSACTION_INFO',
  ADD_USER: 'ADD_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
  ADD_VOLUME: 'ADD_VOLUME',
  SET_AUTO_VOLUME: 'SET_AUTO_VOLUME',
  ADD_BACKUP_PLAN: 'ADD_BACKUP_PLAN',
  EDIT_BACKUP_PLAN: 'EDIT_BACKUP_PLAN',
  DELETE_BACKUP_PLAN: 'DELETE_BACKUP_PLAN',
  ADD_QUERY_PLAN: 'ADD_QUERY_PLAN',
  EDIT_QUERY_PLAN: 'EDIT_QUERY_PLAN',
  DELETE_QUERY_PLAN: 'DELETE_QUERY_PLAN',
};

/**
 * Checks if a specific database action is supported given the database's current state.
 *
 * @param {string} action - One of DB_ACTIONS
 * @param {Object} state - State object
 * @param {boolean} [state.isActive=false] - Whether database is running (CS mode)
 * @param {boolean} [state.isLoggedIn=false] - Whether user is logged into the database
 * @returns {boolean} True if the action can be executed, false if disabled
 */
export function isDbActionSupported(action, { isActive = false, isLoggedIn = false } = {}) {
  switch (action) {
    // 1. Stopped-only operations (DbRunningType.STANDALONE)
    case DB_ACTIONS.START_DB:
    case DB_ACTIONS.DELETE_DB:
    case DB_ACTIONS.RENAME_DB:
    case DB_ACTIONS.COPY_DB:
    case DB_ACTIONS.RESTORE_DB:
    case DB_ACTIONS.OPTIMIZE_DB:
      return !isActive;

    // 2. Stopped + Logged in operations
    case DB_ACTIONS.LOAD_DB:
      return !isActive && isLoggedIn;

    // 3. Active-only operations (DbRunningType.CS)
    case DB_ACTIONS.STOP_DB:
    case DB_ACTIONS.LOCK_INFO:
    case DB_ACTIONS.PLAN_DUMP:
      return isActive;

    // 4. Active + Logged in operations
    case DB_ACTIONS.TRANSACTION_INFO:
    case DB_ACTIONS.ADD_USER:
    case DB_ACTIONS.EDIT_USER:
    case DB_ACTIONS.DELETE_USER:
      return isActive && isLoggedIn;

    // 5. Logged-in only operations (Active or Stopped)
    case DB_ACTIONS.UNLOAD_DB:
    case DB_ACTIONS.ADD_VOLUME:
    case DB_ACTIONS.SET_AUTO_VOLUME:
    case DB_ACTIONS.ADD_BACKUP_PLAN:
    case DB_ACTIONS.EDIT_BACKUP_PLAN:
    case DB_ACTIONS.DELETE_BACKUP_PLAN:
    case DB_ACTIONS.ADD_QUERY_PLAN:
    case DB_ACTIONS.EDIT_QUERY_PLAN:
    case DB_ACTIONS.DELETE_QUERY_PLAN:
      return isLoggedIn;

    // 6. Either active or stopped, no login strictly required
    case DB_ACTIONS.BACKUP_DB:
    case DB_ACTIONS.CHECK_DB:
    case DB_ACTIONS.COMPACT_DB:
    case DB_ACTIONS.PARAM_DUMP:
      return true;

    default:
      return true;
  }
}
