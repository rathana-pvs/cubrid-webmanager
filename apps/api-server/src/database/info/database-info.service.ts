import { StartInfoClientResponse } from '@api-interfaces';
import { GetCreatedbInfoClientResponse } from '@api-interfaces/response/get-createdb-info-client-response';
import { CmsConfigService } from '@cms-config/cms-config.service';
import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import { BaseService, HandleDatabaseErrors } from '@common';
import { CmsError } from '@error/cms/cms-error';
import { HostService } from '@host';
import { Injectable } from '@nestjs/common';
import { BaseCmsRequest, BaseCmsResponse } from '@type';
import { StartInfoCmsResponse } from '@type/cms-response';
import { CMS_CONFNAME_HACONF } from '@database/database.constants';
import { parseHaDbListDbNamesFromHaConf } from '@util';

/**
 * Service for database information (read-only) used across database modules.
 * Provides start-info, create-info and raw CMS startinfo to avoid circular dependencies.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class DatabaseInfoService extends BaseService {
  constructor(
    protected readonly hostService: HostService,
    protected readonly cmsClient: CmsHttpsClientService,
    private readonly cmsConfigService: CmsConfigService
  ) {
    super(hostService, cmsClient);
  }

  /**
   * Get start information for databases on a host (internal/raw CMS).
   * Returns raw CMS response without transformation.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @returns StartInfoCmsResponse
   * @throws CmsError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  async startInfoInternal(userId: string, hostUid: string): Promise<StartInfoCmsResponse> {
    const cmsRequest: BaseCmsRequest = {
      task: 'startinfo',
    };
    const response = await this.executeCmsRequest<
      BaseCmsRequest,
      StartInfoCmsResponse | BaseCmsResponse
    >(userId, hostUid, cmsRequest);

    if (response.status === 'success') {
      return response as StartInfoCmsResponse;
    } else {
      throw CmsError.RequestFailed({ response });
    }
  }

  /**
   * Get start information for databases on a host (client shape with isProfileExists).
   * Per-DB `isHA` is derived from cubrid_ha.conf (CMS `haconf`): the DB name must appear
   * in `[common]` `ha_db_list`. If it is not listed, the DB is treated as non-HA.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @returns StartInfoClientResponse
   * @throws CmsError If request fails or CMS status is fail
   */
  @HandleDatabaseErrors()
  async startInfo(userId: string, hostUid: string): Promise<StartInfoClientResponse> {
    const host = await this.hostService.findHostInternal(userId, hostUid);
    const [cmsStart, haConf] = await Promise.all([
      this.startInfoInternal(userId, hostUid),
      this.cmsConfigService.getAllSystemParam(userId, hostUid, CMS_CONFNAME_HACONF),
    ]);
    const dataOnly = this.extractDomainData(cmsStart);
    const dbProfiles = host.dbProfiles || {};
    const dbs = dataOnly.dblist?.[0]?.dbs || [];
    const activeList = dataOnly.activelist?.[0]?.active || [];

    const haDbNames = parseHaDbListDbNamesFromHaConf(haConf);

    const clientResponse: StartInfoClientResponse = {
      activelist: { active: activeList },
      dblist: {
        dbs: dbs.map((db) => ({
          ...db,
          isProfileExists: !!dbProfiles[db.dbname],
          isHA: haDbNames.has((db.dbname ?? '').trim()),
        })),
      },
    };

    return clientResponse;
  }

  /**
   * Same rules as per-DB `isHA` in {@link startInfo}: DB name must be in `ha_db_list`
   * in cubrid_ha.conf (`haconf`).
   * Used by database start/stop/restart to choose `ha_*` vs `startdb`/`stopdb`.
   */
  @HandleDatabaseErrors()
  async effectiveHaDbForDbname(
    userId: string,
    hostUid: string,
    dbname: string
  ): Promise<boolean> {
    const haConf = await this.cmsConfigService.getAllSystemParam(userId, hostUid, CMS_CONFNAME_HACONF);
    const haDbNames = parseHaDbListDbNamesFromHaConf(haConf);
    return haDbNames.has(dbname.trim());
  }

  /**
   * Get default information for creating a database.
   *
   * @param userId User ID from JWT
   * @param hostUid Host UID
   * @returns GetCreatedbInfoClientResponse
   * @throws CmsError If request fails
   */
  @HandleDatabaseErrors()
  async getCreatedbInfo(userId: string, hostUid: string): Promise<GetCreatedbInfoClientResponse> {
    const envInfo = await this.cmsConfigService.getEnv(userId, hostUid);

    return {
      defaultDbDirectory: envInfo.CUBRID_DATABASES || '',
      cubridVersion: envInfo.CUBRIDVER,
      cubridPath: envInfo.CUBRID,
    };
  }
}
