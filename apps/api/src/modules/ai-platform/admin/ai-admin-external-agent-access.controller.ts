import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AgentCredentialService } from '../credentials/agent-credential.service';
import { AgentGrantService } from '../grants/agent-grant.service';
import { parseOptionalIsoDate } from './ai-admin-dates';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { GrantCapabilityDto } from './dto/grant-capability.dto';
import { GrantScopeDto } from './dto/grant-scope.dto';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { RotateCredentialDto } from './dto/rotate-credential.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/external-agents/:id`)
export class AiAdminExternalAgentAccessController {
  constructor(
    private readonly credentials: AgentCredentialService,
    private readonly grants: AgentGrantService,
  ) {}

  @Get('credentials')
  @ApiOperation({ summary: 'List credentials (prefix/status only)' })
  listCredentials(@Param('id') id: string) {
    return this.credentials.listForAgent(id);
  }

  @Post('credentials')
  @ApiOperation({ summary: 'Issue a one-time External Agent token' })
  issue(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: IssueCredentialDto,
  ) {
    return this.credentials.issue(
      {
        agentId: id,
        label: body.label,
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Post('credentials/:credentialId/rotate')
  @ApiOperation({ summary: 'Rotate a credential and return the new token once' })
  async rotate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('credentialId') credentialId: string,
    @Body() body: RotateCredentialDto,
  ) {
    await this.credentials.requireOnAgent(id, credentialId);
    return this.credentials.rotate(
      {
        credentialId,
        previousValidUntil: parseOptionalIsoDate(body.previousValidUntil),
        expiresAt: parseOptionalIsoDate(body.expiresAt),
      },
      user.id,
    );
  }

  @Post('credentials/:credentialId/revoke')
  @ApiOperation({ summary: 'Revoke one credential' })
  async revokeCredential(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('credentialId') credentialId: string,
  ) {
    await this.credentials.requireOnAgent(id, credentialId);
    return this.credentials.revoke(credentialId, user.id);
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'List capability grants' })
  listCapabilities(@Param('id') id: string) {
    return this.grants.listCapabilities(id);
  }

  @Post('capabilities')
  @ApiOperation({ summary: 'Grant a capability' })
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
  @ApiOperation({ summary: 'Revoke a capability grant' })
  revokeCapability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('capabilityKey') capabilityKey: string,
  ) {
    return this.grants.revokeCapability(id, capabilityKey, user.id);
  }

  @Get('scopes')
  @ApiOperation({ summary: 'List resource scopes' })
  listScopes(@Param('id') id: string) {
    return this.grants.listScopes(id);
  }

  @Post('scopes')
  @ApiOperation({ summary: 'Grant a resource scope' })
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
  @ApiOperation({ summary: 'Revoke a resource scope' })
  async revokeScope(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
  ) {
    await this.grants.requireScopeOnAgent(id, scopeId);
    return this.grants.revokeScope(scopeId, user.id);
  }
}
