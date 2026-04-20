import { HandleHostErrors } from '@common';
import { HostError } from '@error/index';
import { Injectable, Logger } from '@nestjs/common';
import { UserRepositoryService } from '@repository';
import {
  SafeHostList,
  HostInfo,
  User,
} from '@type/index';
import {
  AddHostRequest,
  UpdateHostRequest,
  GetHostsResponse,
  HostResponse,
} from '@api-interfaces';
import { omitHashMap } from '@util';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing host-related operations.
 *
 * Provides business logic for host management including retrieving host lists,
 * adding new hosts, and validating host information. Handles host limits
 * and duplicate detection.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class HostService {
  private readonly logger = new Logger(HostService.name);

  constructor(private readonly repository: UserRepositoryService) {}

  /**
   * Retrieves the list of hosts for a specific user.
   *
   * Loads user data and returns all associated hosts with password fields
   * removed for security purposes.
   *
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<GetHostsResponse>} Response containing the list of hosts
   * @throws {UserError} When user is not found
   * @example
   * ```typescript
   * const response = await hostService.getHostList("user123");
   * console.log(response.hosts); // Array of HostInfo objects without passwords
   * ```
   */
  @HandleHostErrors()
  async getHostList(userId: string): Promise<GetHostsResponse> {
    this.logger.log(`Getting host list for user: ${userId}`);
    const user: User = await this.repository.loadUserById(userId);
    const hosts = user.host_list;
    const hostCount = Object.keys(hosts).length;
    this.logger.log(`Found ${hostCount} hosts for user: ${userId}`);

    return {
      host_list: omitHashMap(hosts, ['password', 'token', 'dbProfiles']) as SafeHostList,
    };
  }

  /**
   * Adds a new host to the user's host list.
   *
   * Validates host limits (max 50 hosts) and checks for duplicates before
   * adding the new host. Uses atomic update to ensure data consistency.
   *
   * @param {string} userId - The unique identifier of the user
   * @param {AddHostRequest} hostInfo - Host information without UID (will be generated)
   * @returns {Promise<User>} The updated user object with the new host
   * @throws {HostError} When host limit is exceeded or duplicate host is found
   * @throws {UserError} When user is not found
   * @example
   * ```typescript
   * const newHost = await hostService.addHost("user123", {
   *   address: "192.168.1.100",
   *   port: 22,
   *   id: "server1",
   *   password: "encrypted_password"
   * });
   * console.log(newHost.host_list); // Contains the new host with generated UID
   * ```
   */
  @HandleHostErrors()
  async addHost(userId: string, hostInfo: AddHostRequest): Promise<SafeHostList> {
    this.logger.log(
      `Adding host for user: ${userId}, address: ${hostInfo.address}, port: ${hostInfo.port}, id: ${hostInfo.id}`
    );
    const updatedUser = await this.repository.atomicUpdateUser(userId, async (user: User) => {
      if (Object.keys(user.host_list).length >= 50) {
        this.logger.warn(
          `Host limit exceeded for user: ${userId}, current count: ${Object.keys(user.host_list).length}`
        );
        throw HostError.ExceedMaxHosts({
          'current host count': 50,
        });
      }

      const duplicate = Object.values(user.host_list).find(
        (host) =>
          host.address === hostInfo.address &&
          host.port === hostInfo.port &&
          host.id === hostInfo.id
      );

      if (duplicate) {
        this.logger.warn(
          `Duplicate host detected for user: ${userId}, duplicate hostUid: ${duplicate.uid}`
        );
        throw HostError.DuplicatedHost({
          duplicatedHostId: duplicate.uid,
        });
      }

      const newHost: HostInfo = {
        uid: uuidv4(),
        ...hostInfo,
        dbProfiles: {},
      };

      user.host_list[newHost.uid] = newHost;
      this.logger.log(`Host added successfully for user: ${userId}, hostUid: ${newHost.uid}`);
      return user;
    });

    const rv = omitHashMap(updatedUser.host_list, ['token', 'password', 'dbProfiles']);
    return rv;
  }

  /**
   * Removes a host from the user's host list.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} hostUid - The unique identifier of the host to be removed.
   * @returns {Promise<User>} The updated user object after removing the host.
   * @throws {HostError.NoSuchHost} If no host with the given UID is found.
   * @throws {UserError} When user is not found.
   */
  @HandleHostErrors()
  async removeHost(userId: string, hostUid: string): Promise<SafeHostList> {
    this.logger.log(`Removing host for user: ${userId}, hostUid: ${hostUid}`);
    const updatedUser = await this.repository.atomicUpdateUser(userId, async (user: User) => {
      if (!user.host_list[hostUid]) {
        this.logger.warn(`Host not found for removal: userId: ${userId}, hostUid: ${hostUid}`);
        throw HostError.NoSuchHost({ hostUid });
      }
      delete user.host_list[hostUid];
      this.logger.log(`Host removed successfully for user: ${userId}, hostUid: ${hostUid}`);
      return user;
    });
    const rv = omitHashMap(updatedUser.host_list, ['token', 'password', 'dbProfiles']);
    return rv;
  }

  /**
   * Updates an existing host in the user's host list.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} hostUid - The unique identifier of the host to be updated.
   * @param {UpdateHostRequest} hostInfo - The new host information to apply.
   * @returns {Promise<User>} The updated user object with the modified host.
   * @throws {HostError.NoSuchHost} If no host with the given UID is found.
   * @throws {HostError.NoSuchUser}
   * @throws {UserError} When user is not found.
   */
  @HandleHostErrors()
  async updateHost(
    userId: string,
    hostUid: string,
    hostInfo: UpdateHostRequest
  ): Promise<SafeHostList> {
    const updateFields = Object.keys(hostInfo).filter(
      (key) => hostInfo[key as keyof UpdateHostRequest] !== undefined
    );
    this.logger.log(
      `Updating host for user: ${userId}, hostUid: ${hostUid}, fields: ${updateFields.join(', ')}`
    );

    const updatedUser = await this.repository.atomicUpdateUser(userId, async (user: User) => {
      if (!user.host_list[hostUid]) {
        this.logger.warn(`Host not found for update: userId: ${userId}, hostUid: ${hostUid}`);
        throw HostError.NoSuchHost({ hostUid });
      }

      const existingHost = user.host_list[hostUid];

      const duplicate = Object.values(user.host_list).find(
        (host) =>
          host.address === hostInfo.address &&
          host.port === hostInfo.port &&
          host.id === hostInfo.id &&
          host.uid != hostUid
      );
      if (duplicate) {
        this.logger.warn(
          `Duplicate host detected during update: userId: ${userId}, hostUid: ${hostUid}, duplicate hostUid: ${duplicate.uid}`
        );
        throw HostError.DuplicatedHost({
          duplicatedHostId: duplicate.uid,
        });
      }

      const updatedHost: HostInfo = {
        uid: hostUid,
        id: hostInfo.id ?? existingHost.id,
        address: hostInfo.address ?? existingHost.address,
        port: hostInfo.port ?? existingHost.port,
        password: hostInfo.password ?? existingHost.password,
        alias: hostInfo.alias ?? existingHost.alias,
        token: hostInfo.token ?? existingHost.token,
        dbProfiles: hostInfo.dbProfiles ?? existingHost.dbProfiles ?? {},
      };

      user.host_list[hostUid] = updatedHost;
      this.logger.log(`Host updated successfully for user: ${userId}, hostUid: ${hostUid}`);
      return user;
    });
    const rv = omitHashMap(updatedUser.host_list, ['token', 'password', 'dbProfiles']);
    return rv;
  }

  /**
   * Finds and returns a single host by its UID (internal use with password).
   *
   * This method is used as infrastructure service by other business services.
   * Errors from this method will be converted to domain errors by the calling service's decorators.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} hostUid - The unique identifier of the host to find.
   * @returns {Promise<HostInfo>} The found host object with password.
   * @throws {HostError.NoSuchHost} If no host with the given UID is found.
   * @throws {UserError} When user is not found.
   */
  @HandleHostErrors()
  async findHostInternal(userId: string, hostUid: string): Promise<HostInfo> {
    this.logger.debug(`Finding host (internal) for user: ${userId}, hostUid: ${hostUid}`);
    const user = await this.repository.loadUserById(userId);
    const host = user.host_list[hostUid];

    if (!host) {
      this.logger.warn(`Host not found (internal): userId: ${userId}, hostUid: ${hostUid}`);
      throw HostError.NoSuchHost({ hostUid });
    }

    return host;
  }

  /**
   * Finds and returns a single host by its UID (external use without password, token, and dbProfiles).
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} hostUid - The unique identifier of the host to find.
   * @returns {Promise<HostResponse>} The found host object without password, token, and dbProfiles.
   * @throws {HostError.NoSuchHost} If no host with the given UID is found.
   * @throws {UserError} When user is not found.
   */
  async findHost(userId: string, hostUid: string): Promise<HostResponse> {
    this.logger.log(`Finding host for user: ${userId}, hostUid: ${hostUid}`);
    const user = await this.repository.loadUserById(userId);
    const host = user.host_list[hostUid];

    if (!host) {
      this.logger.warn(`Host not found: userId: ${userId}, hostUid: ${hostUid}`);
      throw HostError.NoSuchHost({ hostUid });
    }

    const { password, token, dbProfiles, ...hostResponse } = host;
    return hostResponse as HostResponse;
  }

  /**
   * Deletes a host and returns updated host list.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} hostUid - The unique identifier of the host to delete.
   * @returns {Promise<SafeHostList>} Updated host list without password, token, and dbProfiles.
   * @throws {HostError.NoSuchHost} If no host with the given UID is found.
   * @throws {UserError} When user is not found.
   */
  @HandleHostErrors()
  async deleteHost(userId: string, hostUid: string): Promise<SafeHostList> {
    this.logger.log(`Deleting host for user: ${userId}, hostUid: ${hostUid}`);
    const updatedUser = await this.repository.atomicUpdateUser(userId, async (user: User) => {
      if (!user.host_list[hostUid]) {
        this.logger.warn(`Host not found for deletion: userId: ${userId}, hostUid: ${hostUid}`);
        throw HostError.NoSuchHost({ hostUid });
      }
      delete user.host_list[hostUid];
      this.logger.log(`Host deleted successfully for user: ${userId}, hostUid: ${hostUid}`);
      return user;
    });
    return omitHashMap(updatedUser.host_list, ['password', 'token', 'dbProfiles']) as SafeHostList;
  }
}
