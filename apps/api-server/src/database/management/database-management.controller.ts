import { Body, Controller, Get, Logger, Param, Post, Request } from '@nestjs/common';
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
import { validateRequiredFields } from '@util';
import { DatabaseManagementService } from './database-management.service';

/**
 * Controller for handling database management operations.
 * Handles database unloading, loading, optimization, checking, and related management tasks.
 *
 * - All endpoints receive `hostUid` as a path parameter
 * - Follows RESTful pattern: /:hostUid/database/{action}/:dbname
 *
 * @category Controllers
 * @since 1.0.0
 */
@Controller(':hostUid/database')
export class DatabaseManagementController {
  private readonly logger = new Logger(DatabaseManagementController.name);

  constructor(private readonly managementService: DatabaseManagementService) {}

  /**
   * Unload a database.
   * Returns empty object on success.
   *
   * @route POST /:hostUid/database/unload/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing unload configuration
   * @returns Empty object on success
   * @example
   * // POST /host-uid/database/unload/demodb
   * // Body: { "targetdir": "/path/to/backup", "isSchemaIncluded": true, "isDataIncluded": true, "dbuser": "user", "dbpasswd": "pass" }
   */
  @Post('unload/:dbname')
  async unloadDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: UnloadDatabaseRequest
  ): Promise<{}> {
    const userId = req.user.sub;

    validateRequiredFields(
      body,
      ['targetdir', 'isSchemaIncluded', 'isDataIncluded', 'dbuser', 'dbpasswd'],
      'database/unload',
      this.logger
    );

    Logger.log(`Unloading database: ${dbname} on host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.unloadDatabase(userId, hostUid, dbname, body);
  }

  /**
   * Get unload information for databases on a host.
   * Returns domain-only data (CMS envelope removed).
   *
   * @route GET /:hostUid/database/unload-info
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @returns UnloadInfoClientResponse Unload information without CMS envelope fields
   * @example
   * // GET /host-uid/database/unload-info
   */
  @Get('unload-info')
  async getUnloadInfo(
    @Request() req,
    @Param('hostUid') hostUid: string
  ): Promise<UnloadInfoClientResponse> {
    const userId = req.user.sub;

    Logger.log(`Getting unload info for host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.getUnloadInfo(userId, hostUid);
  }

  /**
   * Load a database from schema and object files.
   * Returns domain-only data (CMS envelope removed).
   *
   * @route POST /:hostUid/database/load/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing load configuration
   * @returns LoadDatabaseResponse Load process log lines
   * @example
   * // POST /host-uid/database/load/empty
   * // Body: { "checkoption": "both", "period": "none", "user": "dba", "estimated": "none", "oiduse": "yes", "statisticsuse": "yes", "nolog": "no", "schema": "/path/to/schema", "object": "/path/to/object", "index": "none", "errorcontrolfile": "none", "ignoreclassfile": "none" }
   */
  @Post('load/:dbname')
  async loadDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: LoadDatabaseRequest
  ): Promise<LoadDatabaseResponse> {
    const userId = req.user.sub;

    validateRequiredFields(
      body,
      [
        'checkoption',
        'period',
        'user',
        'estimated',
        'oiduse',
        'statisticsuse',
        'nolog',
        'schema',
        'object',
        'index',
        'errorcontrolfile',
        'ignoreclassfile',
      ],
      'database/load',
      this.logger
    );

    Logger.log(`Loading database: ${dbname} on host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.loadDatabase(userId, hostUid, dbname, body);
  }

  /**
   * Optimize a database.
   * Returns empty object on success.
   *
   * @route POST /:hostUid/database/optimize/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing optional class information
   * @returns OptimizeDatabaseResponse Empty object on success
   * @example
   * // POST /host-uid/database/optimize/empty
   * // Body: { "class": [{ "classname": "dba.test4" }] } (optional - if not provided, optimizes entire database)
   */
  @Post('optimize/:dbname')
  async optimizeDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: OptimizeDatabaseRequest
  ): Promise<OptimizeDatabaseResponse> {
    const userId = req.user.sub;

    Logger.log(`Optimizing database: ${dbname} on host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.optimizeDatabase(userId, hostUid, dbname, body);
  }

  /**
   * Check a database.
   * Returns empty object on success.
   *
   * @route POST /:hostUid/database/check/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing repair option
   * @returns CheckDatabaseResponse Empty object on success
   * @example
   * // POST /host-uid/database/check/test
   * // Body: { "repairdb": "n" } (n = check only, y = check and repair)
   */
  @Post('check/:dbname')
  async checkDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: CheckDatabaseRequest
  ): Promise<CheckDatabaseResponse> {
    const userId = req.user.sub;

    validateRequiredFields(body, ['repairdb'], 'database/check', this.logger);

    Logger.log(`Checking database: ${dbname} on host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.checkDatabase(userId, hostUid, dbname, body);
  }

  /**
   * Compact a database.
   * Returns log output if verbose is 'y', otherwise returns empty object.
   *
   * @route POST /:hostUid/database/compact/:dbname
   * @param req Express request (contains authenticated user)
   * @param hostUid Host unique identifier from path parameter
   * @param dbname Database name from path parameter
   * @param body Request body containing verbose option
   * @returns CompactDatabaseResponse Log output if verbose is 'y', otherwise empty object
   * @example
   * // POST /host-uid/database/compact/test
   * // Body: { "verbose": "y" } (y = include log output, n = exclude log output)
   */
  @Post('compact/:dbname')
  async compactDatabase(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Param('dbname') dbname: string,
    @Body() body: CompactDatabaseRequest
  ): Promise<CompactDatabaseResponse> {
    const userId = req.user.sub;

    validateRequiredFields(body, ['verbose'], 'database/compact', this.logger);

    Logger.log(`Compacting database: ${dbname} on host: ${hostUid}`, 'DatabaseManagementController');
    return await this.managementService.compactDatabase(userId, hostUid, dbname, body);
  }
}
