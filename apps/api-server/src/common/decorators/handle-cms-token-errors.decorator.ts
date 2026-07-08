import { CmsError } from '@error/cms/cms-error';

/**
 * Invalid token error message from CMS.
 */
const INVALID_TOKEN_MESSAGE = 'Request is rejected due to invalid token. Please reconnect.';

/**
 * Checks if a CMS response indicates an invalid token error.
 *
 * @param response - The CMS response to check
 * @returns true if the response indicates an invalid token
 */
export function isInvalidTokenError(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (typeof response.note === 'string') {
    const cleanNote = response.note.replace(/<end>\s*$/i, '').trim();
    const lowerNote = cleanNote.toLowerCase();
    return lowerNote.includes('invalid token') && lowerNote.includes('reconnect');
  }

  return false;
}

/**
 * Checks a CMS response for invalid token errors and throws CmsError.InvalidToken() if found.
 * This is a helper function that can be used directly in service methods.
 *
 * @param response - The CMS response to check
 * @throws CmsError.InvalidToken if the response indicates an invalid token
 * @example
 * ```typescript
 * async startInfo(...): Promise<StartInfoClientResponse> {
 *   const response = await this.cmsClient.postAuthenticated(...);
 *   checkCmsTokenError(response);  // Automatically checks for token errors
 *   // ... rest of processing
 * }
 * ```
 */
export function checkCmsTokenError(response: any): void {
  if (isInvalidTokenError(response)) {
    throw CmsError.InvalidToken({ response });
  }
}
