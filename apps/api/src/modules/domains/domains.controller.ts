import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { DomainsService } from './domains.service';
import type { CreateDomainBody, UpdateDomainBody } from './domains.types';

@ApiTags('Domains')
@ApiBearerAuth()
@Controller()
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get('projects/:projectId/domains')
  @RequirePermission('PROJECTS', 'VIEW')
  @ApiOperation({ summary: 'List project domains (linked to client service records when synced)' })
  listByProject(@Param('projectId') projectId: string) {
    return this.domainsService.listByProject(projectId);
  }

  @Post('projects/:projectId/domains')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Create domain and sync Client Service Record' })
  create(@Param('projectId') projectId: string, @Body() body: CreateDomainBody) {
    return this.domainsService.create(projectId, body);
  }

  @Patch('domains/:id')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update domain and sync linked Client Service Record' })
  update(@Param('id') id: string, @Body() body: UpdateDomainBody) {
    return this.domainsService.update(id, body);
  }

  @Post('domains/:id/sync-client-service')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Create or refresh Client Service Record from domain inventory row' })
  syncClientService(@Param('id') id: string) {
    return this.domainsService.syncClientService(id);
  }
}
