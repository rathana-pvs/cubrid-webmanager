import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardResponse } from '@api-interfaces';

/**
 * Interceptor that wraps successful responses with a standard format.
 *
 * This ensures a consistent API response structure where clients can easily
 * check the success status of an operation.
 *
 * Handlers that return nothing (void) or null map to `data: {}` so empty CMS
 * client payloads are always an object, not null.
 *
 * @category Interceptors
 * @since 1.0.0
 */
@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        const responseData = data == null ? {} : data;

        return {
          data: responseData,
          status: statusCode,
          note: 'success',
        };
      })
    );
  }
}
