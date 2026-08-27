import { describe, it, expect } from 'vitest';
import { DB_ACTIONS, isDbActionSupported } from './databaseActionRules';

describe('databaseActionRules', () => {
  describe('Stopped-only operations', () => {
    const stoppedActions = [
      DB_ACTIONS.START_DB,
      DB_ACTIONS.DELETE_DB,
      DB_ACTIONS.RENAME_DB,
      DB_ACTIONS.COPY_DB,
      DB_ACTIONS.RESTORE_DB,
      DB_ACTIONS.OPTIMIZE_DB,
    ];

    it.each(stoppedActions)('should enable %s when stopped and disable when active', (action) => {
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: false })).toBe(true);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: false })).toBe(false);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: true })).toBe(false);
    });
  });

  describe('Stopped and Logged-in operations (Load Database)', () => {
    it('should only enable LOAD_DB when stopped and logged in', () => {
      expect(isDbActionSupported(DB_ACTIONS.LOAD_DB, { isActive: false, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(DB_ACTIONS.LOAD_DB, { isActive: false, isLoggedIn: false })).toBe(false);
      expect(isDbActionSupported(DB_ACTIONS.LOAD_DB, { isActive: true, isLoggedIn: true })).toBe(false);
      expect(isDbActionSupported(DB_ACTIONS.LOAD_DB, { isActive: true, isLoggedIn: false })).toBe(false);
    });
  });

  describe('Active-only operations', () => {
    const activeActions = [
      DB_ACTIONS.STOP_DB,
      DB_ACTIONS.LOCK_INFO,
      DB_ACTIONS.PLAN_DUMP,
    ];

    it.each(activeActions)('should enable %s when active and disable when stopped', (action) => {
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: false })).toBe(true);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: false })).toBe(false);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: true })).toBe(false);
    });
  });

  describe('Active and Logged-in operations', () => {
    const activeLoggedInActions = [
      DB_ACTIONS.TRANSACTION_INFO,
      DB_ACTIONS.ADD_USER,
      DB_ACTIONS.EDIT_USER,
      DB_ACTIONS.DELETE_USER,
    ];

    it.each(activeLoggedInActions)('should only enable %s when active and logged in', (action) => {
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: false })).toBe(false);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: true })).toBe(false);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: false })).toBe(false);
    });
  });

  describe('Logged-in only operations (Active or Stopped)', () => {
    const loggedInActions = [
      DB_ACTIONS.UNLOAD_DB,
      DB_ACTIONS.ADD_VOLUME,
      DB_ACTIONS.SET_AUTO_VOLUME,
      DB_ACTIONS.ADD_BACKUP_PLAN,
      DB_ACTIONS.EDIT_BACKUP_PLAN,
      DB_ACTIONS.DELETE_BACKUP_PLAN,
      DB_ACTIONS.ADD_QUERY_PLAN,
      DB_ACTIONS.EDIT_QUERY_PLAN,
      DB_ACTIONS.DELETE_QUERY_PLAN,
    ];

    it.each(loggedInActions)('should enable %s whenever logged in regardless of active/stopped state', (action) => {
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: false })).toBe(false);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: false })).toBe(false);
    });
  });

  describe('Operations allowed in either state without login', () => {
    const neutralActions = [
      DB_ACTIONS.BACKUP_DB,
      DB_ACTIONS.CHECK_DB,
      DB_ACTIONS.COMPACT_DB,
      DB_ACTIONS.PARAM_DUMP,
    ];

    it.each(neutralActions)('should enable %s in all states', (action) => {
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: true, isLoggedIn: false })).toBe(true);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: true })).toBe(true);
      expect(isDbActionSupported(action, { isActive: false, isLoggedIn: false })).toBe(true);
    });
  });
});
