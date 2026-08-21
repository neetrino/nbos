import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { TaskDiscussionService } from '../../tasks/task-discussion.service';
import { TasksService } from '../../tasks/tasks.service';
import { resolveCanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService } from '../policy/agent-policy.service';
import { readPage, readPageSize, readRequiredString } from './agent-capability.input';
import { readOptionalSortBy, readOptionalTaskStatus } from './agent-capability.validators';
import { workspacePolicyTarget } from './agent-scope-target';
import { AgentTaskAccess } from './agent-task-access';
import { toScopedAgentTaskLinks } from './agent-task-links.scope';
import { toAgentTaskProjection } from './agent-task-projection';
import type { AgentTaskProjection } from './agent-capability.types';

@Injectable()
export class AgentTaskReadHandler {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policy: AgentPolicyService,
    private readonly tasks: TasksService,
    private readonly discussion: TaskDiscussionService,
    private readonly access: AgentTaskAccess,
  ) {}

  async list(agent: AuthenticatedAgent, input: Record<string, unknown>): Promise<unknown> {
    const workspaceId = readRequiredString(input, 'workspaceId');
    const workspace = await resolveCanonicalWorkSpace(this.prisma, workspaceId);
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey: 'tasks.list',
      target: workspace ? workspacePolicyTarget(workspace) : { workspaceId },
    });
    if (!workspace) {
      throw AgentAccessException.resourceNotAvailable();
    }
    const result = await this.tasks.findAll({
      workspaceId: workspace.id,
      status: readOptionalTaskStatus(input),
      page: readPage(input),
      pageSize: readPageSize(input),
      sortBy: readOptionalSortBy(input),
      sortOrder: 'desc',
    });
    return {
      items: result.items.map(toAgentTaskProjection),
      meta: result.meta,
    };
  }

  async read(
    agent: AuthenticatedAgent,
    input: Record<string, unknown>,
  ): Promise<AgentTaskProjection> {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.read',
      readRequiredString(input, 'taskId'),
    );
    return toAgentTaskProjection(task);
  }

  async readLinks(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const { task, workspace } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.read_links',
      readRequiredString(input, 'taskId'),
    );
    return toScopedAgentTaskLinks(this.prisma, workspace, task.links ?? [], async (target) => {
      const decision = await this.policy.evaluate({
        actor: agent.actor,
        agentState: agent.agentState,
        credentialState: agent.credentialState,
        capabilityKey: 'tasks.read_links',
        target,
      });
      return decision.outcome === 'ALLOW';
    });
  }

  async readDiscussion(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.read_discussion',
      readRequiredString(input, 'taskId'),
      'SENSITIVE',
    );
    const page = await this.discussion.listEntries(task.id, {
      page: readPage(input),
      pageSize: readPageSize(input),
    });
    return {
      items: page.items.map((entry) => ({
        id: entry.id,
        body: entry.body,
        authorActorType: entry.authorActorType,
        authorDisplayName: entry.authorDisplayName,
        createdAt: entry.createdAt.toISOString(),
      })),
      meta: page.meta,
    };
  }
}
