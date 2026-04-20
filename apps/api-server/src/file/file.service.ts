import { Injectable, Logger } from '@nestjs/common';
import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import { CmsAuthService } from '@cms-auth/cms-auth.service';
import { UserRepositoryService } from '@repository';
import { CheckFileCmsRequest, CheckFileCmsResponse, HostInfo } from '@type/index';
import { CheckFileClientRequest } from '@api-interfaces';
import { HostError } from '@error/index';
import { HandleCmsErrors } from '@common';
import { CmsError } from '@error/cms/cms-error';
import { checkCmsTokenError, checkCmsStatusError } from '@common';

/**
 * Service for file operations.
 *
 * Provides business logic for file management operations including
 * file checking, uploading, downloading, and listing.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  constructor(
    private readonly cmsHttpsClient: CmsHttpsClientService,
    private readonly cmsAuthService: CmsAuthService,
    private readonly userRepository: UserRepositoryService
  ) {}

  /**
   * Checks if files exist on the specified CMS host.
   *
   * @param {string} userId - The unique identifier of the user
   * @param {string} hostUid - The unique identifier of the host
   * @param {string[]} [files] - Optional list of file paths to check
   * @returns {Promise<CheckFileCmsResponse>} Response containing file check information
   * @throws {HostError.NoSuchHost} If no host with the given UID is found
   */
  @HandleCmsErrors()
  async checkFile(
    userId: string,
    hostUid: string,
    request: CheckFileClientRequest
  ): Promise<CheckFileCmsResponse> {
    const user = await this.userRepository.loadUserById(userId);
    const host: HostInfo = user.host_list[hostUid];

    if (!host) {
      throw HostError.NoSuchHost({ hostUid });
    }

    const authUrl = `https://${host.address}:${host.port}/cm_api`;
    const checkFileRequest: CheckFileCmsRequest = {
      task: 'checkfile',
      token: host.token,
      ...(request.file && request.file.length > 0 ? { file: request.file } : {}),
    };

    // Log outgoing CMS request
    this.logger.debug(
      `CMS checkfile request -> host: ${hostUid}, files: ${request.file?.length ?? 0}, payload: ${JSON.stringify(checkFileRequest)}`
    );

    const response = await this.cmsHttpsClient.postAuthenticated<
      CheckFileCmsRequest,
      CheckFileCmsResponse
    >(authUrl, checkFileRequest);
    // Log incoming CMS response
    this.logger.debug(`CMS checkfile response <- ${JSON.stringify(response)}`);

    checkCmsTokenError(response);
    checkCmsStatusError(response, `Failed to check file: ${response.note || 'Unknown error'}`);

    // Return CMS response as-is (existfile: string)
    return response;
  }

  /**
   * Internal method to check files on CMS host using Host object directly.
   * Used by other services that already have HostInfo.
   *
   * @param {HostInfo} host - Host information object
   * @param {string[]} files - List of file paths to check
   * @returns {Promise<CheckFileCmsResponse>} Response containing file check information
   * @throws {CmsError} If CMS call fails or token is invalid
   */
  @HandleCmsErrors()
  async checkfileInternal(host: HostInfo, files: string[]): Promise<CheckFileCmsResponse> {
    if (!host.token) {
      throw CmsError.InvalidToken();
    }

    const authUrl = `https://${host.address}:${host.port}/cm_api`;
    const checkFileRequest: CheckFileCmsRequest = {
      task: 'checkfile',
      token: host.token,
      ...(files && files.length > 0 ? { file: files } : {}),
    };

    // Log outgoing CMS request
    this.logger.debug(
      `CMS checkfile request (internal) -> host: ${host.address}:${host.port}, files: ${files.length}, payload: ${JSON.stringify(checkFileRequest)}`
    );

    const response = await this.cmsHttpsClient.postAuthenticated<
      CheckFileCmsRequest,
      CheckFileCmsResponse
    >(authUrl, checkFileRequest);

    // Log incoming CMS response
    this.logger.debug(`CMS checkfile response (internal) <- ${JSON.stringify(response)}`);

    checkCmsTokenError(response);
    checkCmsStatusError(response, `Failed to check file: ${response.note || 'Unknown error'}`);

    // Return CMS response as-is (existfile: string)
    return response;
  }
}
