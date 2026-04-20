import { Body, Controller, Logger, Param, Post, Request } from '@nestjs/common';
import { HeartbeatListClientRequest, HeartbeatListClientResponse } from '@api-interfaces';
import { HaReloadCmsResponse } from '@type/cms-response';
import { HaService } from './ha.service';
import { validateRequiredFields } from '@util';

@Controller(':hostUid/ha')
export class HaController {
  private readonly logger = new Logger(HaController.name);

  constructor(private readonly haService: HaService) {}

  /**
   * Get HA heartbeat information.
   * CMS task: heartbeatlist
   *
   * @route POST /:hostUid/ha/heartbeat-list
   */
  @Post('heartbeat-list')
  async heartbeatList(
    @Request() req,
    @Param('hostUid') hostUid: string,
    @Body() body: HeartbeatListClientRequest
  ): Promise<HeartbeatListClientResponse> {
    const userId = req.user.sub;
    this.logger.log(`Getting HA heartbeat list on host: ${hostUid}`);
    validateRequiredFields(body, ['dbmodeall'], '/ha/heartbeatlist')
    return await this.haService.heartbeatList(userId, hostUid, body);
  }

  /**
   * Reload HA configuration on the CMS host.
   * CMS task: ha_reload
   *
   * @route POST /:hostUid/ha/reload
   */
  @Post('reload')
  async haReload(
    @Request() req,
    @Param('hostUid') hostUid: string
  ): Promise<HaReloadCmsResponse> {
    const userId = req.user.sub;
    this.logger.log(`HA reload on host: ${hostUid}`);
    return await this.haService.haReload(userId, hostUid);
  }
}

