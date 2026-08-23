import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AGENT_ARTIFACT_MAX_BYTES } from '../protocol/agent-artifact-content';
import {
  AgentProtocolEndpoints,
  AGENT_IDEMPOTENCY_HEADER,
  AGENT_REST_NAMESPACE,
  CurrentAgent,
} from '../protocol/agent-protocol.decorators';
import { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import type { AgentResponseBody } from '../protocol/agent-response.envelope';
import { withPathOverrides, type AgentRequestBody } from './agent-rest.input';

const CONTENT_FIELD = 'contentBase64';

/**
 * Task-linked Drive artifacts.
 *
 * Reads are addressed through the owning task rather than a bare artifact id,
 * so the Task/Work Space link that authorizes the file is part of the request
 * instead of something the server has to infer. Secret-adjacent and
 * finance/legal-sensitive files answer exactly like a missing file.
 */
@AgentProtocolEndpoints()
@Controller(AGENT_REST_NAMESPACE)
export class AgentArtifactsController {
  constructor(private readonly invoker: AgentProtocolInvoker) {}

  @Get('tasks/:taskId/artifacts')
  @ApiOperation({ summary: 'List artifacts linked to an authorized task' })
  listArtifacts(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({ agent, operationId: 'artifacts.list', input: { taskId } });
  }

  @Get('tasks/:taskId/artifacts/:fileAssetId')
  @ApiOperation({
    summary: 'Read one linked artifact with a short-lived view URL',
    description: 'Artifacts outside the task link, or above INTERNAL, are reported as missing.',
  })
  @ApiResponse({ status: 404, description: 'AGENT_RESOURCE_NOT_AVAILABLE.' })
  getArtifact(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Param('fileAssetId') fileAssetId: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'artifacts.get',
      input: { taskId, fileAssetId },
    });
  }

  @Post('tasks/:taskId/artifacts')
  @ApiOperation({
    summary: 'Attach a generated artifact to a task',
    description: `Content is base64 in ${CONTENT_FIELD}, at most ${AGENT_ARTIFACT_MAX_BYTES} bytes. The bytes are passed to Drive as a binary payload, never as a task field.`,
  })
  @ApiHeader({
    name: AGENT_IDEMPOTENCY_HEADER,
    required: true,
    description: 'Stable client operation id. A safe retry does not create a second file.',
  })
  attachArtifact(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    const { [CONTENT_FIELD]: contentBase64, ...metadata } = body ?? {};
    return this.invoker.invoke({
      agent,
      operationId: 'artifacts.attach',
      input: withPathOverrides(metadata, { taskId }),
      idempotencyKey,
      contentBase64,
    });
  }
}
