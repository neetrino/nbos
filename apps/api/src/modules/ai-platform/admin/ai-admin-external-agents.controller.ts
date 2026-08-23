import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { ExternalAgentService } from '../agents/external-agent.service';
import { parseOptionalIsoDate } from './ai-admin-dates';
import { AiAdminQueryService } from './ai-admin-query.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { CreateExternalAgentDto } from './dto/create-external-agent.dto';
import { UpdateExternalAgentDto } from './dto/update-external-agent.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/external-agents`)
export class AiAdminExternalAgentsController {
  constructor(
    private readonly agents: ExternalAgentService,
    private readonly query: AiAdminQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List External Agents with grants and credentials' })
  list() {
    return this.query.listExternalAgentSummaries();
  }

  @Post()
  @ApiOperation({ summary: 'Create an External Agent' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateExternalAgentDto) {
    return this.agents.create(
      {
        name: body.name,
        description: body.description,
        ownerId: user.id,
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'External Agent detail, grants, scopes, credentials' })
  getById(@Param('id') id: string) {
    return this.query.getExternalAgentBundle(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update External Agent identity' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateExternalAgentDto,
  ) {
    return this.agents.update(
      id,
      {
        name: body.name,
        description: body.description,
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable an External Agent' })
  disable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.agents.disable(id, user.id);
  }

  @Post(':id/enable')
  @ApiOperation({ summary: 'Re-enable a disabled External Agent (REVOKED is terminal)' })
  enable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.agents.enable(id, user.id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an External Agent (terminal)' })
  revoke(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.agents.revoke(id, user.id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Audit trail for one External Agent including grants and credentials' })
  activity(@Param('id') id: string, @Query() query: ActivityQueryDto) {
    return this.query.getExternalAgentActivity(id, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
