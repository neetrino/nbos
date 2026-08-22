import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AgentGrantService } from '../grants/agent-grant.service';
import { AiAdminQueryService } from './ai-admin-query.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { GrantWorkspaceAccessDto } from './dto/grant-workspace-access.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/workspaces/:workspaceId/access`)
export class AiAdminWorkspaceAccessController {
  constructor(
    private readonly query: AiAdminQueryService,
    private readonly grants: AgentGrantService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'External Agents scoped to this Work Space (same grants as central UI)',
  })
  list(@Param('workspaceId') workspaceId: string) {
    return this.query.listWorkspaceAccess(workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Grant an existing External Agent this Work Space' })
  grant(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Body() body: GrantWorkspaceAccessDto,
  ) {
    return this.grants.grantScope(
      {
        agentId: body.agentId,
        scopeType: 'WORKSPACE',
        scopeId: workspaceId,
        reason: body.reason,
      },
      user.id,
    );
  }

  @Delete(':scopeId')
  @ApiOperation({ summary: 'Revoke this Work Space grant' })
  async revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Param('workspaceId') workspaceId: string,
    @Param('scopeId') scopeId: string,
  ) {
    await this.grants.requireScopeOnWorkspace(workspaceId, scopeId);
    return this.grants.revokeScope(scopeId, user.id);
  }
}
