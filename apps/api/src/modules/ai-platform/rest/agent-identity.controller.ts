import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import {
  AgentProtocolEndpoints,
  AGENT_REST_NAMESPACE,
  CurrentAgent,
} from '../protocol/agent-protocol.decorators';
import { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import type { AgentResponseBody } from '../protocol/agent-response.envelope';

/**
 * Identity and Work Space discovery for External Agents.
 *
 * Every handler is a one-line translation into an operation id. Authorization,
 * projection and audit belong to the gateway behind `AgentProtocolInvoker`.
 */
@AgentProtocolEndpoints()
@Controller(AGENT_REST_NAMESPACE)
export class AgentIdentityController {
  constructor(private readonly invoker: AgentProtocolInvoker) {}

  @Get('me')
  @ApiOperation({
    summary: 'Identity of the calling External Agent',
    description: 'Returns actor identity only. Capabilities and grants are never disclosed.',
  })
  @ApiResponse({ status: 200, description: 'Agent identity.' })
  @ApiResponse({ status: 401, description: 'AGENT_AUTH_INVALID.' })
  me(@CurrentAgent() agent: AuthenticatedAgent): Promise<AgentResponseBody> {
    return this.invoker.invoke({ agent, operationId: 'identity.read', input: {} });
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'List Work Spaces this agent is authorized to see' })
  @ApiResponse({ status: 200, description: 'Authorized Work Spaces page.' })
  @ApiResponse({ status: 403, description: 'AGENT_CAPABILITY_DENIED.' })
  listWorkspaces(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'workspaces.list',
      input: { page, pageSize },
    });
  }

  @Get('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Read one authorized Work Space' })
  @ApiResponse({ status: 200, description: 'Work Space projection.' })
  @ApiResponse({
    status: 404,
    description: 'AGENT_RESOURCE_NOT_AVAILABLE — missing and unauthorized are indistinguishable.',
  })
  getWorkspace(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'workspaces.get',
      input: { workspaceId },
    });
  }
}
