import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HandleCmsErrors } from '@common';
import { CmsForwardClientRequest } from '@api-interfaces';
import { BaseCmsRequest } from '@type';
import * as https from 'https';
import * as net from 'net';
import { ConfigService } from '@config/config.service';

class CmsHttpsAgent extends https.Agent {
  createConnection(
    options: Parameters<https.Agent['createConnection']>[0],
    callback?: Parameters<https.Agent['createConnection']>[1]
  ): ReturnType<https.Agent['createConnection']> {
    const socket = super.createConnection(options, callback);
    (socket as net.Socket).setKeepAlive?.(true, 30_000);
    return socket;
  }
}
import { HostService } from '@host';
import { EncryptionService } from '@security';
import { checkCmsTokenError, checkCmsStatusError } from '@common';
import { formatAuditLog } from '@util';

/**
 * Callback function to determine whether status check should be skipped.
 * Returns true if status check should be skipped, false otherwise.
 *
 * @param task - The task name from the request
 * @param response - The CMS response (before status check)
 * @returns true if status check should be skipped, false otherwise
 */
export type ShouldSkipStatusCheckCallback = (task: string, response: any) => boolean;

/**
 * Service for handling secure HTTPS client communications with CMS (Central Management System).
 * This service provides methods for making authenticated and unauthenticated requests to CMS APIs,
 * and for forwarding client requests after augmenting them with necessary authentication tokens.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class CmsHttpsClientService {
  private readonly logger = new Logger(CmsHttpsClientService.name);
  private httpsAgent: CmsHttpsAgent | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly hostService: HostService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Sends an unauthenticated POST request to a public CMS API endpoint.
   * This method is suitable for endpoints that do not require a user authentication token.
   * @param url - The target URL of the CMS API endpoint.
   * @param data - The request payload, excluding the authentication token.
   * @returns A Promise that resolves with the response data from the CMS API.
   * @throws CmsError if the request fails or an unexpected error occurs.
   */
  @HandleCmsErrors()
  public async postPublic<T extends Omit<BaseCmsRequest, 'token'>, P>(
    url: string,
    data: T
  ): Promise<P> {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: this.getHttpsAgent(),
    };
    const startedAt = Date.now();
    this.logCmsRequest('public', url, data);
    const response = await firstValueFrom(this.httpService.post<P>(url, data, config));
    this.logCmsResponse('public', url, data, response.data, Date.now() - startedAt);
    return response.data;
  }

  /**
   * Sends an authenticated POST request to a CMS API endpoint.
   * This method expects the request data to include an authentication token.
   * @param url - The target URL of the CMS API endpoint.
   * @param data - The request payload, including the authentication token.
   * @returns A Promise that resolves with the response data from the CMS API.
   * @throws CmsError if the request fails or an unexpected error occurs.
   */
  @HandleCmsErrors()
  public async postAuthenticated<T extends BaseCmsRequest, P>(
    url: string,
    data: T,
    options?: { timeoutMs?: number }
  ): Promise<P> {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: this.getHttpsAgent(),
      ...(options?.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
    };
    const startedAt = Date.now();
    this.logCmsRequest('authenticated', url, data);
    const response = await firstValueFrom(this.httpService.post<P>(url, data, config));
    this.logCmsResponse('authenticated', url, data, response.data, Date.now() - startedAt);
    return response.data;
  }

  /**
   * Forwards an authenticated client request to a CMS API endpoint.
   * This method retrieves host information, constructs the full CMS API URL,
   * and injects the necessary authentication token into the request body before sending it.
   * The client is not expected to provide the token directly.
   *
   * @param sub - The subject (user ID) from the authentication token, used to find the host.
   * @param requestBody - The original request payload from the client, containing hostUid and task.
   * @param shouldSkipStatusCheck - Optional callback to determine if status check should be skipped (for CMS bug workarounds).
   * @returns A Promise that resolves with the response data from the CMS API.
   * @throws HostError.NoSuchHost if the specified host is not found.
   * @throws CmsError if the forwarded request fails or an unexpected error occurs.
   */
  @HandleCmsErrors()
  public async forwardAuthenticated<T extends CmsForwardClientRequest, P>(
    sub: string,
    requestBody: T,
    shouldSkipStatusCheck?: ShouldSkipStatusCheckCallback
  ): Promise<P> {
    const hostUid = requestBody.hostUid;
    const host = await this.hostService.findHostInternal(sub, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    const request: BaseCmsRequest = {
      token: (host.token as string) || '',
      ...requestBody,
    };
    const rv = (await this.postAuthenticated(url, request)) as any;

    checkCmsTokenError(rv);

    const task = requestBody.task;
    const shouldSkip = shouldSkipStatusCheck ? shouldSkipStatusCheck(task, rv) : false;

    if (!shouldSkip) {
      checkCmsStatusError(rv, `CMS request failed: ${rv.note || 'Unknown error'}`);
    }

    return rv;
  }

  private logCmsRequest(scope: 'public' | 'authenticated', url: string, data: unknown): void {
    this.logger.debug(
      formatAuditLog('cms_request', {
        scope,
        address: url,
        task: this.extractTask(data),
        payload: data,
      })
    );
  }

  private logCmsResponse(
    scope: 'public' | 'authenticated',
    url: string,
    data: unknown,
    response: unknown,
    durationMs: number
  ): void {
    const cmsResponse = response as { status?: string; __EXEC_TIME?: string };
    this.logger.debug(
      formatAuditLog('cms_response', {
        scope,
        address: url,
        task: this.extractTask(data),
        status: cmsResponse.status ?? 'unknown',
        execTime: cmsResponse.__EXEC_TIME,
        durationMs,
        payload: response,
      })
    );
  }

  private extractTask(data: unknown): string | undefined {
    if (!data || typeof data !== 'object' || !('task' in data)) {
      return undefined;
    }

    const task = (data as { task?: unknown }).task;
    return typeof task === 'string' ? task : undefined;
  }

  private getHttpsAgent(): CmsHttpsAgent {
    if (!this.httpsAgent) {
      const ca = this.configService.getCmsCaCert();
      this.httpsAgent = new CmsHttpsAgent({
        rejectUnauthorized: this.configService.getCmsRejectUnauthorized(),
        keepAlive: true,
        ...(ca ? { ca } : {}),
      });
    }
    return this.httpsAgent;
  }
}
