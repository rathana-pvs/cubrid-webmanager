import {
  CheckDatabaseRequest,
  CheckDatabaseResponse,
  CompactDatabaseRequest,
  CompactDatabaseResponse,
  LoadDatabaseRequest,
  LoadDatabaseResponse,
  OptimizeDatabaseRequest,
  OptimizeDatabaseResponse,
  UnloadDatabaseRequest,
  UnloadInfoClientResponse,
} from '@api-interfaces';
import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import {
  checkCmsStatusError,
  checkCmsTokenError,
  HandleCmsStatusErrors,
  HandleDatabaseErrors,
} from '@common';
import { CmsError } from '@error/cms/cms-error';
import { DatabaseError } from '@error/database/database-error';
import { HostService } from '@host';
import { Injectable, Logger } from '@nestjs/common';
import {
  CheckDatabaseCmsRequest,
  CompactDatabaseCmsRequest,
  LoadDatabaseCmsRequest,
  OptimizeDatabaseCmsRequest,
  UnloadDatabaseCmsRequest,
  UnloadInfoCmsRequest,
} from '@type/cms-request';
import {
  CheckDatabaseCmsResponse,
  CompactDatabaseCmsResponse,
  LoadDatabaseCmsResponse,
  OptimizeDatabaseCmsResponse,
  UnloadDatabaseCmsResponse,
  UnloadInfoCmsResponse,
} from '@type/cms-response';

/**
 * Service for managing database management operations.
 * Handles database unloading, loading, optimization, checking, and related management tasks.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class DatabaseManagementService {
  private readonly logger = new Logger(DatabaseManagementService.name);

  constructor(
    private readonly hostService: HostService,
    private readonly cmsClient: CmsHttpsClientService
  ) {}

  /**
   * Unload a database.
   * Returns empty object on success.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @param dbname Database name
   * @param request Client request containing unload information
   * @returns Empty object on success
   * @throws DatabaseError If request fails or parameters are invalid
   */
  @HandleDatabaseErrors()
  @HandleCmsStatusErrors()
  async unloadDatabase(
    userId: string,
    hostUid: string,
    dbname: string,
    request: UnloadDatabaseRequest
  ): Promise<{}> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    // Determine target based on isSchemaIncluded and isDataIncluded
    let target: 'schema' | 'object' | 'both';

    if (request.isSchemaIncluded && request.isDataIncluded) {
      target = 'both';
    } else if (request.isSchemaIncluded) {
      target = 'schema';
    } else if (request.isDataIncluded) {
      target = 'object';
    } else {
      throw DatabaseError.InvalidParameter(
        'Both isSchemaIncluded and isDataIncluded cannot be false',
        {
          isSchemaIncluded: request.isSchemaIncluded,
          isDataIncluded: request.isDataIncluded,
        }
      );
    }

    // Build CMS request from client request
    const cmsRequest: UnloadDatabaseCmsRequest = {
      task: 'unloaddb',
      token: host.token || '',
      dbname: dbname,
      targetdir: request.targetdir,
      target: target,
      dbuser: request.dbuser,
      dbpasswd: request.dbpasswd,
      usehash: request.usehash,
      hashdir: request.hashdir,
      class: request.class,
      ref: request.ref,
      classonly: request.classonly,
      'as-dba': request['as-dba'],
      'skip-index-detail': request['skip-index-detail'],
      'split-schema-files': request['split-schema-files'],
      delimit: request.delimit,
      estimate: request.estimate,
      prefix: request.prefix,
      cach: request.cach,
      lofile: request.lofile,
    };

    const response = await this.cmsClient.postAuthenticated<
      UnloadDatabaseCmsRequest,
      UnloadDatabaseCmsResponse
    >(url, cmsRequest);

    checkCmsTokenError(response);
    checkCmsStatusError(response);

    return response.result;
  }

  /**
   * Get unload information for databases on a host.
   * Returns domain-only data (CMS envelope removed).
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @returns UnloadInfoClientResponse Unload information without CMS envelope fields
   * @throws DatabaseError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  async getUnloadInfo(
    userId: string,
    hostUid: string
  ): Promise<UnloadInfoClientResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    const request: UnloadInfoCmsRequest = {
      task: 'unloadinfo',
      token: host.token || '',
    };

    const response = await this.cmsClient.postAuthenticated<
      UnloadInfoCmsRequest,
      UnloadInfoCmsResponse
    >(url, request);

    checkCmsTokenError(response);
    checkCmsStatusError(response);

    const { __EXEC_TIME, note, status, task, ...dataOnly } = response;

    return {
      database: dataOnly.database || [],
    };
  }

  /**
   * Load a database from schema and object files.
   * Returns empty object on success.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @param dbname Database name
   * @param request Client request containing load configuration
   * @returns LoadDatabaseResponse Empty object on success
   * @throws DatabaseError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  @HandleCmsStatusErrors()
  async loadDatabase(
    userId: string,
    hostUid: string,
    dbname: string,
    request: LoadDatabaseRequest
  ): Promise<LoadDatabaseResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    // Build CMS request from client request
    const cmsRequest: LoadDatabaseCmsRequest = {
      task: 'loaddb',
      token: host.token || '',
      dbname: dbname,
      checkoption: request.checkoption,
      period: request.period,
      user: request.user,
      estimated: request.estimated,
      oiduse: request.oiduse,
      statisticsuse: request.statisticsuse,
      nolog: request.nolog,
      schema: request.schema,
      object: request.object,
      index: request.index,
      errorcontrolfile: request.errorcontrolfile,
      ignoreclassfile: request.ignoreclassfile,
    };

    const response = await this.cmsClient.postAuthenticated<
      LoadDatabaseCmsRequest,
      LoadDatabaseCmsResponse
    >(url, cmsRequest);

    checkCmsTokenError(response);
    
    try {
      checkCmsStatusError(response);
    } catch (error) {
      if (error instanceof CmsError) {
        // Join line array with newline characters
        const lines = response.line || [];
        const lineMessage = lines.join('\n');

        // Update error message with line information
        const updatedMessage = error.additionalData?.message
          ? `${error.additionalData.message}\n${lineMessage}`
          : lineMessage || 'Error occurred during database loading';

        throw CmsError.RequestFailed(
          {
            message: updatedMessage,
            response: response,
          },
          error
        );
      }
      throw error;
    }

    // Success: return empty object
    return {};
  }

  /**
   * Optimize a database.
   * Returns empty object on success.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @param dbname Database name
   * @param request Client request containing optional class information
   * @returns OptimizeDatabaseResponse Empty object on success
   * @throws DatabaseError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  @HandleCmsStatusErrors()
  async optimizeDatabase(
    userId: string,
    hostUid: string,
    dbname: string,
    request: OptimizeDatabaseRequest
  ): Promise<OptimizeDatabaseResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    // Build CMS request from client request
    const cmsRequest: OptimizeDatabaseCmsRequest = {
      task: 'optimizedb',
      token: host.token || '',
      dbname: dbname,
      ...(request.class && { class: request.class }),
    };

    const response = await this.cmsClient.postAuthenticated<
      OptimizeDatabaseCmsRequest,
      OptimizeDatabaseCmsResponse
    >(url, cmsRequest);

    checkCmsTokenError(response);
    checkCmsStatusError(response);

    // Success: return empty object
    return {};
  }

  /**
   * Check a database.
   * Returns empty object on success.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @param dbname Database name
   * @param request Client request containing repair option
   * @returns CheckDatabaseResponse Empty object on success
   * @throws DatabaseError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  @HandleCmsStatusErrors()
  async checkDatabase(
    userId: string,
    hostUid: string,
    dbname: string,
    request: CheckDatabaseRequest
  ): Promise<CheckDatabaseResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    const cmsRequest: CheckDatabaseCmsRequest = {
      task: 'checkdb',
      token: host.token || '',
      dbname: dbname,
      repairdb: request.repairdb,
    };

    const response = await this.cmsClient.postAuthenticated<
      CheckDatabaseCmsRequest,
      CheckDatabaseCmsResponse
    >(url, cmsRequest);

    checkCmsTokenError(response);
    checkCmsStatusError(response);

    // Success: return empty object
    return {};
  }

  /**
   * Compact a database.
   * Returns log output if verbose is 'y', otherwise returns empty object.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @param dbname Database name
   * @param request Client request containing verbose option
   * @returns CompactDatabaseResponse Log output if verbose is 'y', otherwise empty object
   * @throws DatabaseError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  @HandleCmsStatusErrors()
  async compactDatabase(
    userId: string,
    hostUid: string,
    dbname: string,
    request: CompactDatabaseRequest
  ): Promise<CompactDatabaseResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const url = `https://${host.address}:${host.port}/cm_api`;

    const cmsRequest: CompactDatabaseCmsRequest = {
      task: 'compactdb',
      token: host.token || '',
      dbname: dbname,
      verbose: request.verbose,
    };

    const response = await this.cmsClient.postAuthenticated<
      CompactDatabaseCmsRequest,
      CompactDatabaseCmsResponse
    >(url, cmsRequest);

    checkCmsTokenError(response);
    checkCmsStatusError(response);

    // Return log if present, otherwise return empty object
    if (response.log) {
      return {
        log: response.log,
      };
    }

    return {};
  }
}
