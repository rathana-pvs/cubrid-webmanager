import { isInvalidTokenError, checkCmsTokenError } from './handle-cms-token-errors.decorator';
import { CmsError } from '@error/cms/cms-error';

describe('handle-cms-token-errors.decorator', () => {
  describe('isInvalidTokenError', () => {
    it('should return false for non-object/null values', () => {
      expect(isInvalidTokenError(null)).toBe(false);
      expect(isInvalidTokenError(undefined)).toBe(false);
      expect(isInvalidTokenError('error')).toBe(false);
      expect(isInvalidTokenError(123)).toBe(false);
    });

    it('should return false for object without note field', () => {
      expect(isInvalidTokenError({ status: 'error' })).toBe(false);
    });

    it('should return true for exact INVALID_TOKEN_MESSAGE', () => {
      expect(
        isInvalidTokenError({
          note: 'Request is rejected due to invalid token. Please reconnect.',
        })
      ).toBe(true);
    });

    it('should return true for INVALID_TOKEN_MESSAGE ending with <end>', () => {
      expect(
        isInvalidTokenError({
          note: 'Request is rejected due to invalid token. Please reconnect.<end>',
        })
      ).toBe(true);
      expect(
        isInvalidTokenError({
          note: 'Request is rejected due to invalid token. Please reconnect.<end>  \n',
        })
      ).toBe(true);
    });

    it('should return true for case-insensitive matches containing invalid token and reconnect', () => {
      expect(
        isInvalidTokenError({
          note: 'request is rejected due to invalid token. please reconnect',
        })
      ).toBe(true);
    });

    it('should return true for session lock and concurrent connection variations', () => {
      expect(isInvalidTokenError({ note: 'session lock error' })).toBe(true);
      expect(isInvalidTokenError({ note: 'Another user is already connected to this host.' })).toBe(true);
      expect(isInvalidTokenError({ note: 'concurrent connection occurred' })).toBe(true);
      expect(isInvalidTokenError({ note: 'session is locked by another user' })).toBe(true);
    });

    it('should return false for unrelated notes', () => {
      expect(
        isInvalidTokenError({
          note: 'Another database error occurred.',
        })
      ).toBe(false);
    });
  });

  describe('checkCmsTokenError', () => {
    it('should throw CmsError.InvalidToken if response indicates invalid token', () => {
      const response = {
        note: 'Request is rejected due to invalid token. Please reconnect.<end>',
      };
      expect(() => checkCmsTokenError(response)).toThrow(CmsError);
    });

    it('should not throw if response is fine', () => {
      const response = {
        note: 'Success',
      };
      expect(() => checkCmsTokenError(response)).not.toThrow();
    });
  });
});
