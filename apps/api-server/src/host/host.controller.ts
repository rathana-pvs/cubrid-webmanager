import { Body, Controller, Delete, Get, Param, Post, Put, Request } from '@nestjs/common';
import { GetHostsResponse, HostResponse } from '@api-interfaces';
import { HostService } from './host.service';
import {
  AddHostDto,
  CreateHostGroupDto,
  UpdateHostGroupDto,
  MoveHostDto,
  UpdateHostClientDto,
  MarkHaDto,
} from '@type/index';

@Controller('host')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @Post()
  async addHost(@Request() request, @Body() hostInfo: AddHostDto): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.addHost(userId, hostInfo) };
  }

  @Post('group')
  async createGroup(
    @Request() request,
    @Body() body: CreateHostGroupDto
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.createHostGroup(userId, body.name) };
  }

  @Put('group/:groupId')
  async updateGroup(
    @Request() request,
    @Param('groupId') groupId: string,
    @Body() body: UpdateHostGroupDto
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.updateHostGroup(userId, groupId, body) };
  }

  @Delete('group/:groupId')
  async deleteGroup(
    @Request() request,
    @Param('groupId') groupId: string
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.deleteHostGroup(userId, groupId) };
  }

  @Get()
  async getHosts(@Request() request): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return await this.hostService.getHostList(userId);
  }

  @Get(':hostUid')
  async getHost(@Request() request, @Param('hostUid') hostUid: string): Promise<HostResponse> {
    const userId = request.user.sub;
    return await this.hostService.findHost(userId, hostUid);
  }

  @Put(':hostUid')
  async updateHost(
    @Request() request,
    @Param('hostUid') hostUid: string,
    @Body() hostInfo: UpdateHostClientDto
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.updateHost(userId, hostUid, hostInfo) };
  }

  @Post(':hostUid/move')
  async moveHost(
    @Request() request,
    @Param('hostUid') hostUid: string,
    @Body() body: MoveHostDto
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return {
      host_groups: await this.hostService.moveHost(userId, hostUid, body.targetGroupId),
    };
  }

  @Delete(':hostUid')
  async deleteHost(
    @Request() request,
    @Param('hostUid') hostUid: string
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.deleteHost(userId, hostUid) };
  }

  @Post(':hostUid/mark-ha')
  async markHa(
    @Request() request,
    @Param('hostUid') hostUid: string,
    @Body() body: MarkHaDto
  ): Promise<GetHostsResponse> {
    const userId = request.user.sub;
    return { host_groups: await this.hostService.markGroupHa(userId, hostUid, body?.groupName) };
  }
}
