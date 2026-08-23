import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../common/decorators';
import { AuditService } from '../../audit/audit.service';
import { AiAdminQueryService } from './ai-admin-query.service';
import {
  AI_ADMIN_AUDIT_ENTITY_TYPES,
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { ActivityQueryDto } from './dto/activity-query.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(AI_ADMIN_ROUTE_PREFIX)
export class AiAdminOverviewController {
  constructor(
    private readonly query: AiAdminQueryService,
    private readonly audit: AuditService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'AI & Agents operational overview' })
  overview() {
    return this.query.overview();
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'Grantable Phase 1 capability catalog' })
  capabilities() {
    return this.query.listCapabilities();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent AI Platform audit activity' })
  activity(@Query() query: ActivityQueryDto) {
    return this.audit.findRecentByEntityTypes([...AI_ADMIN_AUDIT_ENTITY_TYPES], {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('disable-impact')
  @ApiOperation({ summary: 'Name Model Policies and Internal Agents affected by a disable' })
  disableImpact(@Query('kind') kind?: string, @Query('id') id?: string) {
    return this.query.getDisableImpact(kind ?? '', id ?? '');
  }
}
