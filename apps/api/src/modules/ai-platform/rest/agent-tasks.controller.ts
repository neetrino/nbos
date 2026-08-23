import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import {
  AgentProtocolEndpoints,
  AGENT_IDEMPOTENCY_HEADER,
  AGENT_REST_NAMESPACE,
  CurrentAgent,
} from '../protocol/agent-protocol.decorators';
import { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import type { AgentResponseBody } from '../protocol/agent-response.envelope';
import { withPathOverrides, type AgentRequestBody } from './agent-rest.input';

const IDEMPOTENCY_HEADER_DOC: Parameters<typeof ApiHeader>[0] = {
  name: AGENT_IDEMPOTENCY_HEADER,
  required: true,
  description: 'Stable client operation id. A safe retry returns the original result.',
};

/**
 * Task read and semantic write operations.
 *
 * Phase 1 deliberately exposes no delete route, no generic status assignment
 * and no force-completion: `tasks.delete`, `tasks.set_status` and
 * `tasks.force_complete` are absent from the capability catalog, so there is
 * nothing for a route to reach even if one were added by mistake.
 */
@AgentProtocolEndpoints()
@Controller(AGENT_REST_NAMESPACE)
export class AgentTasksController {
  constructor(private readonly invoker: AgentProtocolInvoker) {}

  @Get('workspaces/:workspaceId/tasks')
  @ApiOperation({ summary: 'List tasks in an authorized Work Space' })
  @ApiResponse({ status: 200, description: 'Task page.' })
  listTasks(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.list',
      input: { workspaceId, status, sortBy, page, pageSize },
    });
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Read one authorized task' })
  @ApiResponse({ status: 404, description: 'AGENT_RESOURCE_NOT_AVAILABLE.' })
  getTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({ agent, operationId: 'tasks.get', input: { taskId } });
  }

  @Get('tasks/:taskId/discussion')
  @ApiOperation({ summary: 'Read the task discussion visible to this agent' })
  getDiscussion(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.discussion',
      input: { taskId, page, pageSize },
    });
  }

  @Post('workspaces/:workspaceId/tasks')
  @ApiOperation({ summary: 'Create a task in an authorized Work Space' })
  @ApiHeader(IDEMPOTENCY_HEADER_DOC)
  @ApiResponse({
    status: 403,
    description: 'AGENT_CAPABILITY_DENIED when tasks.create is not granted.',
  })
  createTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('workspaceId') workspaceId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.create',
      input: withPathOverrides(body, { workspaceId }),
      idempotencyKey,
    });
  }

  @Patch('tasks/:taskId')
  @ApiOperation({
    summary: 'Update allowlisted task fields',
    description:
      'Only title, description, priority and dueDate. Requires expectedUpdatedAt as an optimistic lock.',
  })
  @ApiHeader(IDEMPOTENCY_HEADER_DOC)
  @ApiResponse({ status: 409, description: 'AGENT_CONFLICT when the task changed meanwhile.' })
  updateTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.update',
      input: withPathOverrides(body, { taskId }),
      idempotencyKey,
    });
  }

  @Post('tasks/:taskId/start')
  @ApiOperation({ summary: 'Semantic Start Task transition' })
  @ApiHeader(IDEMPOTENCY_HEADER_DOC)
  startTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.start',
      input: withPathOverrides(body, { taskId }),
      idempotencyKey,
    });
  }

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add a progress note attributed to the agent' })
  @ApiHeader(IDEMPOTENCY_HEADER_DOC)
  addComment(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.comment',
      input: withPathOverrides(body, { taskId }),
      idempotencyKey,
    });
  }

  @Post('tasks/:taskId/submit-review')
  @ApiOperation({
    summary: 'Submit work for human review',
    description: 'Never final completion. Human acceptance stays a Tasks workflow decision.',
  })
  @ApiHeader(IDEMPOTENCY_HEADER_DOC)
  submitReview(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param('taskId') taskId: string,
    @Body() body: AgentRequestBody,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<AgentResponseBody> {
    return this.invoker.invoke({
      agent,
      operationId: 'tasks.submitReview',
      input: withPathOverrides(body, { taskId }),
      idempotencyKey,
    });
  }
}
