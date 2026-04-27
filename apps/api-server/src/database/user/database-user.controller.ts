import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { DatabaseUserService } from './database-user.service';
import {
  CreateDbUserRequest,
  DatabaseLoginClientRequest,
  UpdateDbUserRequest,
  UpdateDbUserResponse,
  UserInfoClientResponse,
  CreateDbUserResponse,
  DeleteDbUserResponse,
  UserVerifyRequest,
  UserVerifyResponse,
} from '@api-interfaces';
import { validateRequiredFields } from '@util';

/**
 * Controller for managing database users.
 *
 * - All endpoints receive `hostUid` as a path parameter
 * - Follows RESTful pattern: /:hostUid/database/users/{action}/{identifier}
 *
 * @category Controllers
 * @since 1.0.0
 */
@Controller(':hostUid/database/users')
export class DatabaseUserController {
  private readonly logger = new Logger(DatabaseUserController.name);

  constructor(private readonly databaseUserService: DatabaseUserService) {}

  /**
   * Get user info (list of users) for a database. CMS task: userinfo.
   *
   * @route GET /:hostUid/database/users/info/:dbname
   */
  @Get('info/:dbname')
  async getUserInfo(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string
  ): Promise<UserInfoClientResponse> {
    const userId = req.user.sub;
    this.logger.log(`Getting user info for database: ${dbname} on host: ${hostUid}`);
    return await this.databaseUserService.getUserInfo(userId, hostUid, dbname);
  }

  /**
   * Verify database user credentials. CMS task: userverify.
   *
   * @route POST /:hostUid/database/users/verify
   */
  @Post('verify')
  async userVerify(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Body() body: UserVerifyRequest
  ): Promise<UserVerifyResponse> {
    const userId = req.user.sub;
    validateRequiredFields(body, ['dbname', 'dbuser', 'dbpasswd'], 'database/users/verify', this.logger);
    this.logger.log(`Verifying user ${body.dbuser} for database: ${body.dbname} on host: ${hostUid}`);
    return await this.databaseUserService.userVerify(
      userId,
      hostUid,
      body.dbname,
      body.dbuser,
      body.dbpasswd
    );
  }

  /**
   * Create a database user. CMS task: createuser.
   *
   * @route POST /:hostUid/database/users
   */
  @Post()
  async createUser(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Body() body: CreateDbUserRequest
  ): Promise<CreateDbUserResponse> {
    const userId = req.user.sub;
    validateRequiredFields(
      body,
      ['dbname', 'username', 'userpass', 'groups', 'authorization'],
      'database/users/create',
      this.logger
    );
    this.logger.log(`Creating user: ${body.username} in database: ${body.dbname} on host: ${hostUid}`);
    return await this.databaseUserService.createUser(
      userId,
      hostUid,
      body.dbname,
      body.username,
      body.userpass,
      body.groups,
      body.authorization
    );
  }

  /**
   * Delete a database user. CMS task: deleteuser.
   *
   * @route DELETE /:hostUid/database/users/:dbname/:username
   */
  @Delete(':dbname/:username')
  async deleteUser(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Param('username') username: string
  ): Promise<DeleteDbUserResponse> {
    const userId = req.user.sub;
    this.logger.log(`Deleting user: ${username} from database: ${dbname} on host: ${hostUid}`);
    return await this.databaseUserService.deleteUser(userId, hostUid, dbname, username);
  }

  /**
   * Get list of database users for a specific host.
   *
   * @route GET /:hostUid/database/users
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @returns Database users list
   * @example
   * // GET /host-uid/database/users
   */
  @Get()
  async getDatabaseUsers(@Request() req, @Param('hostUid') _hostUid: string) {
    const userId = req.user.sub;
    return await this.databaseUserService.getDatabaseUsers(userId);
  }

  /**
   * Login to a database using client-provided credentials.
   *
   * - Requires `id` and `password` in request body
   * - Does not fallback to stored profile
   *
   * @route POST /:hostUid/database/users/login/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing `id`, `password`
   * @returns boolean True on success
   * @example
   * // POST /host-uid/database/users/login/demodb
   * // Body: { "id": "user", "password": "pass" }
   */
  @Post('login/:dbname')
  async loginDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: Omit<DatabaseLoginClientRequest, 'hostUid' | 'dbname'>
  ): Promise<boolean> {
    const userId = req.user.sub;
    validateRequiredFields(body, ['id', 'password'], `database/users/login/${dbname}`, this.logger);
    this.logger.log(`Logging in to database: ${dbname} on host: ${hostUid}`);
    return await this.databaseUserService.loginDatabase(
      userId,
      hostUid,
      dbname,
      body.id,
      body.password
    );
  }

  /**
   * Login to a database using stored profile credentials only.
   *
   * - Uses `host.dbProfiles[dbname]`
   * - Fails if profile is missing
   *
   * @route POST /:hostUid/database/users/login-with-profile/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @returns boolean True on success
   */
  @Post('login-with-profile/:dbname')
  async loginDatabaseWithProfile(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string
  ): Promise<boolean> {
    const userId = req.user.sub;
    this.logger.log(`Logging in to database: ${dbname} on host: ${hostUid} (using profile)`);
    return await this.databaseUserService.loginDatabase(userId, hostUid, dbname);
  }

  /**
   * Update a database user.
   * Returns empty object on success.
   *
   * @route PUT /:hostUid/database/users/:dbname/:username
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param username Username to update from path parameter
   * @param body Request body containing user information
   * @returns UpdateDbUserResponse Empty object on success
   * @example
   * // PUT /host-uid/database/users/demodb/yifan
   * // Body: { "userpass": "1111", "groups": { "group": ["public"] }, "authorization": [] }
   */
  @Put(':dbname/:username')
  async updateUser(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Param('username') username: string,
    @Body() body: Omit<UpdateDbUserRequest, 'dbname' | 'username'>
  ): Promise<UpdateDbUserResponse> {
    const userId = req.user.sub;

    validateRequiredFields(
      body,
      ['userpass', 'groups', 'authorization'],
      'database/users/update',
      this.logger
    );

    this.logger.log(
      `Updating user: ${username} in database: ${dbname} on host: ${hostUid}`
    );
    return await this.databaseUserService.updateUser(
      userId,
      hostUid,
      dbname,
      username,
      body.userpass,
      body.groups,
      body.authorization
    );
  }
}
