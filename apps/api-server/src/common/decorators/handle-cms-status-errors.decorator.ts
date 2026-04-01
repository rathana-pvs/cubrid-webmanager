import { CmsError } from '@error/cms/cms-error';
import { Logger } from '@nestjs/common';

/**
 * Checks if a CMS response indicates a failure (status === 'fail').
 *
 * @param response - The CMS response to check
 * @returns true if the response indicates a failure
 */
export function isCmsStatusFailure(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if ('status' in response) {
    return response.status === 'fail' || response.status === 'failure';
  }

  return false;
}

/**
 * Checks a CMS response for failure status and throws CmsError.RequestFailed if found.
 * This is a helper function that can be used directly in service methods.
 *
 * @param response - The CMS response to check
 * @param errorMessage - Optional custom error message
 * @throws CmsError.RequestFailed if the response status is 'fail'
 * @example
 * ```typescript
 * async getBrokerLogList(...): Promise<GetBrokerLogListClientResponse> {
 *   const cmsResponse = await this.client.forwardAuthenticated(...);
 *   checkCmsStatusError(cmsResponse);  // Automatically checks status === 'fail'
 *   // ... rest of processing
 * }
 * ```
 */
export function checkCmsStatusError(response: any, errorMessage?: string): void {
  if (isCmsStatusFailure(response)) {
    // Use custom error message if provided, otherwise use response.note if it's user-friendly
    // response.note from CMS typically contains user-friendly error messages (e.g., "Invalid password")
    const message =
      errorMessage ||
      (response.note ? `CMS request failed: ${response.note}` : 'CMS request failed');
    Logger.log(message);
    throw CmsError.RequestFailed({
      message: message,
      response: response,
    });
  }
}
