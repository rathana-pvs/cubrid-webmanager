import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import { BaseService, HandleCmsErrors, HandleHostErrors } from '@common';
import { HostService } from '@host';
import { Injectable } from '@nestjs/common';
import {
  HaReloadCmsRequest,
  HaStartDatabaseCmsRequest,
  HaStopDatabaseCmsRequest,
  HeartbeatListCmsRequest,
} from '@type/cms-request';
import {
  HaReloadCmsResponse,
  HaStartDatabaseCmsResponse,
  HaStopDatabaseCmsResponse,
  HeartbeatListCmsResponse,
} from '@type/cms-response';
import { HeartbeatListClientRequest, HeartbeatListClientResponse } from '@api-interfaces';

@Injectable()
export class HaService extends BaseService {
  constructor(
    protected readonly hostService: HostService,
    protected readonly cmsClient: CmsHttpsClientService
  ) {
    super(hostService, cmsClient);
  }

  /**
   * Get HA heartbeat list data.
   * CMS task: heartbeatlist.
   */
  @HandleHostErrors()
  @HandleCmsErrors()
  async heartbeatList(
    userId: string,
    hostUid: string,
    request: HeartbeatListClientRequest
  ): Promise<HeartbeatListClientResponse> {
    const cmsRequest: HeartbeatListCmsRequest = {
      task: 'heartbeatlist',
      dbmodeall: request.dbmodeall,
    };

    const response = await this.executeCmsRequest<
      HeartbeatListCmsRequest,
      HeartbeatListCmsResponse
    >(userId, hostUid, cmsRequest);

    const data = this.extractDomainData(response);
    const hadbinfolist = Array.isArray(data.hadbinfolist)
      ? data.hadbinfolist
      : (data.hadbinfolist ?? {});

    return {
      ...data,
      hadbinfolist,
      hanodelist: data.hanodelist ?? [],
    };
  }

  @HandleHostErrors()
  @HandleCmsErrors()
  async heartbeatlistInternal(userId: string, hostUid: string): Promise<HeartbeatListCmsResponse> {
    const cmsRequest: HeartbeatListCmsRequest = {
      task: 'heartbeatlist',
      dbmodeall: 'y',
    };
    return this.executeCmsRequest(userId, hostUid, cmsRequest);
  }

  /**
   * CMS `ha_start` — `{ task, dbname }` + token; success envelope `task: 'ha_start'`.
   */
  @HandleHostErrors()
  @HandleCmsErrors()
  async haStart(
    userId: string,
    hostUid: string,
    dbname: string
  ): Promise<HaStartDatabaseCmsResponse> {
    const cmsRequest: HaStartDatabaseCmsRequest = {
      task: 'ha_start',
      dbname,
    };
    return this.executeCmsRequest<HaStartDatabaseCmsRequest, HaStartDatabaseCmsResponse>(
      userId,
      hostUid,
      cmsRequest
    );
  }

  /**
   * CMS `ha_stop` — `{ task, dbname }` + token; success envelope `task: 'ha_stop'`.
   */
  @HandleHostErrors()
  @HandleCmsErrors()
  async haStop(
    userId: string,
    hostUid: string,
    dbname: string
  ): Promise<HaStopDatabaseCmsResponse> {
    const cmsRequest: HaStopDatabaseCmsRequest = {
      task: 'ha_stop',
      dbname,
    };
    return this.executeCmsRequest<HaStopDatabaseCmsRequest, HaStopDatabaseCmsResponse>(
      userId,
      hostUid,
      cmsRequest
    );
  }

  /**
   * CMS `ha_reload` — `{ task: 'ha_reload' }` + token; success envelope `task: 'ha_reload'`.
   */
  @HandleHostErrors()
  @HandleCmsErrors()
  async haReload(userId: string, hostUid: string): Promise<HaReloadCmsResponse> {
    const cmsRequest: HaReloadCmsRequest = {
      task: 'ha_reload',
    };
    return this.executeCmsRequest<HaReloadCmsRequest, HaReloadCmsResponse>(
      userId,
      hostUid,
      cmsRequest
    );
  }
}
