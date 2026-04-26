import { AppError, ConfigError, CmsError, HostError } from '@error';
import { Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

export type HandleCmsErrorsOptions = {
  /**
   * Maps Axios/HTTP exceptions to CmsError (default: true).
   */
  mapHttpErrors?: boolean;
  /** AppError/other errors -> ConfigError.Unknown('config') or CmsError.Unknown('cms') */
  appErrorFallback?: 'config' | 'cms';
};

function mapAxiosToCmsError(error: unknown): CmsError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const e = error as AxiosError;
  if (!('response' in e) && !('request' in e) && !('config' in e)) {
    return null;
  }
  if (e.response) {
    return CmsError.RequestFailed(
      {
        status: e.response.status,
        data: e.response.data,
      },
      error as Error
    );
  }
  if (e.request) {
    Logger.log(e.request);
    return CmsError.NoResponse(undefined, error as Error);
  }
  return null;
}

function handleCatch(
  err: unknown,
  propertyKey: string,
  mapHttpErrors: boolean,
  appErrorFallback: HandleCmsErrorsOptions['appErrorFallback']
): never {

  if (mapHttpErrors) {
    const fromAxios = mapAxiosToCmsError(err);
    if (fromAxios) {
      throw fromAxios;
    }
  }

  if (err instanceof ConfigError) {
    throw err;
  }
  if (err instanceof CmsError) {
    throw err;
  }
  if (err instanceof HostError) {
    throw err;
  }

  if (err instanceof AppError) {
    if (appErrorFallback === 'config') {
      throw ConfigError.Unknown(
        {
          originalCode: err.code,
          originalMessage: err.message,
          ...err.additionalData,
        },
        err
      );
    }
    if (appErrorFallback === 'cms') {
      throw CmsError.Unknown(
        { originalCode: err.code, originalMessage: err.message, ...err.additionalData },
        err
      );
    }
    throw err;
  }

  if (appErrorFallback === 'config') {
    console.error(`[HandleCmsErrors] Unknown error in ${propertyKey}:`, err);
    throw ConfigError.Unknown(
      {
        originalMessage: err instanceof Error ? err.message : String(err),
      },
      err instanceof Error ? err : undefined
    );
  }
  if (appErrorFallback === 'cms') {
    console.error(`[HandleCmsErrors] Unknown error in ${propertyKey}:`, err);
    throw CmsError.Unknown(
      { originalMessage: err instanceof Error ? err.message : String(err) },
      err instanceof Error ? err : undefined
    );
  }

  throw CmsError.Unknown({ message: (err as Error)?.message || 'Unknown error' }, err as Error);
}

/**
 * Unified decorator for CMS-related error handling.
 * - HTTP(Axios) -> CmsError
 * - Optional: map other AppError instances to Config/Cms Unknown (cms-config, cms-user, etc.)
 */
export function HandleCmsErrors(options?: HandleCmsErrorsOptions) {
  const mapHttpErrors = options?.mapHttpErrors !== false;
  const appErrorFallback = options?.appErrorFallback;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (err) {
        handleCatch(err, propertyKey, mapHttpErrors, appErrorFallback);
      }
    };

    return descriptor;
  };
}
