import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { InternalAgentGrantService } from '../internal-agents/internal-agent-grant.service';
import { parseOptionalIsoDate } from './ai-admin-dates';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { GrantCapabilityDto } from './dto/grant-capability.dto';
import { GrantScopeDto } from './dto/grant-scope.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/internal-agents/:id`)
export class AiAdminInternalAgentAccessController {
  constructor(private readonly grants: InternalAgentGrantService) {}

  @Get('capabilities')
  @ApiOperation({ summary: 'List Internal Agent capability grants' })
  listCapabilities(@Param('id') id: string) {
    return this.grants.listCapabilities(id);
  }

  @Post('capabilities')
  @ApiOperation({ summary: 'Grant an Internal Agent capability' })
  grantCapability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: GrantCapabilityDto,
  ) {
    return this.grants.grantCapability(
      {
        agentId: id,
        capabilityKey: body.capabilityKey,
        reason: body.reason,
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Delete('capabilities/:capabilityKey')
  @ApiOperation({ summary: 'Revoke an Internal Agent capability' })
  revokeCapability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('capabilityKey') capabilityKey: string,
  ) {
    return this.grants.revokeCapability(id, capabilityKey, user.id);
  }

  @Get('scopes')
  @ApiOperation({ summary: 'List Internal Agent scopes' })
  listScopes(@Param('id') id: string) {
    return this.grants.listScopes(id);
  }

  @Post('scopes')
  @ApiOperation({ summary: 'Grant an Internal Agent scope' })
  grantScope(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: GrantScopeDto,
  ) {
    return this.grants.grantScope(
      {
        agentId: id,
        scopeType: body.scopeType,
        scopeId: body.scopeId,
        resourceType: body.resourceType,
        reason: body.reason,
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Delete('scopes/:scopeId')
  @ApiOperation({ summary: 'Revoke an Internal Agent scope' })
  async revokeScope(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
  ) {
    await this.grants.requireScopeOnAgent(id, scopeId);
    return this.grants.revokeScope(scopeId, user.id);
  }
}
