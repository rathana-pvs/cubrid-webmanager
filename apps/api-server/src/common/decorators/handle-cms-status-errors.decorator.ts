import { CmsError } from '@error/cms/cms-error';
import { Logger } from '@nestjs/common';

/**
 * Checks if a CMS response indicates a failure (status === 'fail').
 *
 * @param response - The CMS response to check
 * @returns true if the response indicates a failure
 */
export function isCmsStatusFailure(response: any): boolean {
  if (!response || typeof response !== 'object' || !('status' in response)) {
    return false;
  }

  const normalized = String(response.status).trim().toLowerCase();
  if (normalized === 'success' || normalized === 'ok') {
    return false;
  }

  if (normalized.includes('fail') || normalized === 'error') {
    return true;
  }

  return normalized !== 'success';
}

const CMS_ERROR_LINE_PREFIX = /^\s*ERROR:/i;
const CMS_ERROR_LINE_PHRASE = /error occurred/i;

export function getCmsErrorLines(response: any): string[] {
  if (!response || !Array.isArray(response.line)) {
    return [];
  }

  return response.line
    .map((line: unknown) => String(line).trim())
    .filter(
      (text) =>
        text !== '' && (CMS_ERROR_LINE_PREFIX.test(text) || CMS_ERROR_LINE_PHRASE.test(text))
    );
}

/** CMS may return status=success while reporting errors in `line` (e.g. loaddb). */
export function hasCmsLineFailure(response: any): boolean {
  return getCmsErrorLines(response).length > 0;
}

/** Failure check for long-running jobs (unload/load background jobs). */
export function isCmsLongJobFailure(response: any): boolean {
  return isCmsStatusFailure(response) || hasCmsLineFailure(response);
}

function stripCmsArtifacts(s: string): string {
  return s.replace(/<end>\s*$/i, '').trim();
}

export function extractCmsFailureMessage(response: any, errorMessage?: string): string {
  const noteMessage = isMeaningfulCmsNote(response?.note)
    ? stripCmsArtifacts(String(response.note))
    : undefined;
  const errorLines = getCmsErrorLines(response);
  const lineMessage =
    errorLines.length > 0
      ? errorLines.join('\n')
      : Array.isArray(response?.line)
        ? response.line
            .map((line: unknown) => String(line))
            .filter((line) => line.trim() !== '')
            .join('\n')
            .trim()
        : '';
  return (
    errorMessage ||
    noteMessage ||
    (lineMessage !== '' ? lineMessage : undefined) ||
    'CMS request failed'
  );
}

export function extractCmsLongJobFailureMessage(response: any, errorMessage?: string): string {
  return extractCmsFailureMessage(response, errorMessage);
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
  if (!isCmsStatusFailure(response)) {
    return;
  }

  const message = extractCmsFailureMessage(response, errorMessage);

  Logger.log(message);
  throw CmsError.RequestFailed({
    message,
    response,
  });
}

function isMeaningfulCmsNote(note: unknown): boolean {
  if (note === undefined || note === null) {
    return false;
  }

  const value = String(note).trim();
  if (!value) {
    return false;
  }

  return value.toLowerCase() !== 'none';
}
