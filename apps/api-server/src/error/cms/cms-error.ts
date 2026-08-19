import { AppError } from '@error/app-error';
import { CmsErrorCode } from './cms-error-code';

/**
 * Represents a CMS-specific error.
 * Extends AppError and provides static factory methods for common CMS error scenarios.
 *
 * @category Errors
 * @since 1.0.0
 */
export class CmsError extends AppError {
  constructor(
    kind: 'CMS',
    code: CmsErrorCode,
    additionalData?: Record<string, any>,
    originalError?: Error
  ) {
    super(kind, code, additionalData, originalError);
  }

  /**
   * Creates an error indicating that the request to the CMS API failed.
   */
  static RequestFailed(additionalData?: Record<string, any>, originalError?: Error) {
    return new CmsError('CMS', CmsErrorCode.REQUEST_FAILED, additionalData, originalError);
  }

  /**
   * Creates an error indicating that no response was received from the CMS API.
   */
  static NoResponse(additionalData?: Record<string, any>, originalError?: Error) {
    return new CmsError('CMS', CmsErrorCode.NO_RESPONSE, additionalData, originalError);
  }

  /**
   * Creates an error indicating a TLS/certificate problem connecting to CMS
   * (e.g. an expired or untrusted certificate) — distinct from NoResponse so
   * this doesn't get misread as a transient network/timeout issue.
   */
  static TlsError(additionalData?: Record<string, any>, originalError?: Error) {
    return new CmsError('CMS', CmsErrorCode.TLS_ERROR, additionalData, originalError);
  }

  /**
   * Creates an error for an unknown CMS issue.
   */
  static Unknown(additionalData?: Record<string, any>, originalError?: Error) {
    return new CmsError('CMS', CmsErrorCode.UNKNOWN, additionalData, originalError);
  }

  /**
   * Creates an error indicating an invalid authentication token for CMS.
   */
  static InvalidToken(additionalData?: Record<string, any>, originalError?: Error) {
    return new CmsError('CMS', CmsErrorCode.INVALID_TOKEN, additionalData, originalError);
  }
}
