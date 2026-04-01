import { Injectable, Logger } from '@nestjs/common';
import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import {
  HostInfo,
  CheckFileCmsRequest,
  LoginCmsRequest,
  LoginCmsResponse,
  User,
} from '@type/index';
import { UserRepositoryService } from '@repository';
import { HostError } from '@error/index';

/**
 * Service for handling authentication with the CMS (Central Management System).
 * This service manages the login process to CMS hosts, including retrieving host credentials,
 * performing the login request, and storing the obtained authentication token.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class CmsAuthService {
  constructor(
    private readonly client: CmsHttpsClientService,
    private readonly repository: UserRepositoryService
  ) {}

  /**
   * Performs a login operation to a specific CMS host for a given user.
   * Retrieves host details, constructs a login request, sends it to the CMS,
   * and stores the received authentication token in the user's host information.
   *
   * @param userId - The ID of the user performing the login.
   * @param uid - The unique identifier of the host to log in to.
   * @returns A Promise that resolves with the authentication token received from the CMS.
   * @throws HostError.NoSuchHost if the specified host is not found for the user.
   */
  public async login(userId: string, uid: string) {
    const user = await this.repository.loadUserById(userId);
    Logger.log(uid);
    const host: HostInfo = user.host_list[uid];
    if (!host) {
      throw HostError.NoSuchHost({ uid: uid });
    }

    const url = `https://${host.address}:${host.port}/cm_api`;
    const request: LoginCmsRequest = {
      task: 'login',
      host: host.address,
      port: host.port.toString(),
      id: host.id,
      password: host.password,
      clientver: '11.4', // Request-shaped only; arbitrary string, no CMS behavior impact
    };

    const response = await this.client.postPublic<LoginCmsRequest, LoginCmsResponse>(url, request);

    host.token = response.token;
    await this.repository.atomicUpdateUser(userId, async (user: User) => {
      user.host_list[uid] = host;
      return user;
    });

    return response.token;
  }

  /**
   * Tests a login operation to a CMS host using provided host information.
   * This method is typically used for testing connectivity and credentials without
   * associating the host with a specific user.
   *
   * @param host - The host information to use for the login test.
   * @returns A Promise that resolves with the authentication token received from the CMS.
   */
  public async testLogin(host: HostInfo): Promise<string> {
    const url = `https://${host.address}:${host.port}/cm_api`;

    const requestData: LoginCmsRequest = {
      task: 'login',
      host: host.address,
      port: host.port.toString(),
      id: host.id,
      password: host.password,
      clientver: '13.23', // Same as login: request placeholder, no behavioral effect
    };

    const response = await this.client.postPublic<LoginCmsRequest, LoginCmsResponse>(
      url,
      requestData
    );

    return response.token;
  }
}
