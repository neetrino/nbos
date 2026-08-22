import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { ExternalAgentService } from '../agents/external-agent.service';
import { TaskDiscussionService } from '../../tasks/task-discussion.service';
import {
  isTaskAgentUpdateAllowedField,
  TASK_AGENT_UPDATE_ALLOWED_FIELDS,
} from '../../tasks/task-agent-update.allowlist';
import { TasksService } from '../../tasks/tasks.service';
import { resolveCanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService } from '../policy/agent-policy.service';
import { readOptionalString, readRequiredString } from './agent-capability.input';
import {
  readOptionalIsoDate,
  readOptionalTaskPriority,
  readRequiredIsoDateTime,
} from './agent-capability.validators';
import { workspacePolicyTarget } from './agent-scope-target';
import { AgentTaskAccess } from './agent-task-access';
import { toAgentTaskProjection } from './agent-task-projection';

@Injectable()
export class AgentTaskWriteHandler {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policy: AgentPolicyService,
    private readonly tasks: TasksService,
    private readonly discussion: TaskDiscussionService,
    private readonly agents: ExternalAgentService,
    private readonly access: AgentTaskAccess,
  ) {}

  async create(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const workspaceId = readRequiredString(input, 'workspaceId');
    const workspace = await resolveCanonicalWorkSpace(this.prisma, workspaceId);
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey: 'tasks.create',
      target: workspace ? workspacePolicyTarget(workspace) : { workspaceId },
    });
    if (!workspace) {
      throw AgentAccessException.resourceNotAvailable();
    }
    const owner = await this.agents.findById(agent.agentId);
    if (!owner) {
      throw AgentAccessException.fromDenyReason('ACTOR_NOT_SUPPORTED');
    }
    const created = await this.tasks.create(
      {
        title: readRequiredString(input, 'title'),
        description: readOptionalString(input, 'description'),
        priority: readOptionalTaskPriority(input),
        dueDate: readOptionalIsoDate(input, 'dueDate'),
        workspaceId: workspace.id,
        creatorId: owner.ownerId,
      },
      { type: agent.actor.actor.type, id: agent.actor.actor.id },
    );
    return toAgentTaskProjection(created);
  }

  async update(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const taskId = readRequiredString(input, 'taskId');
    const { task } = await this.access.requireAuthorizedTask(agent, 'tasks.update', taskId);
    const expectedUpdatedAt = readRequiredIsoDateTime(input, 'expectedUpdatedAt');
    const patch = pickAllowedUpdate(input);
    const updated = await this.tasks.update(task.id, patch, undefined, expectedUpdatedAt);
    return toAgentTaskProjection(updated);
  }

  async start(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.start',
      readRequiredString(input, 'taskId'),
    );
    const updated = await this.tasks.start(task.id);
    return toAgentTaskProjection(updated);
  }

  async comment(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.comment',
      readRequiredString(input, 'taskId'),
    );
    const entry = await this.discussion.addEntry(
      task.id,
      agent.actor,
      readRequiredString(input, 'body'),
    );
    return { id: entry.id, createdAt: entry.createdAt.toISOString() };
  }

  async submitReview(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.submit_review',
      readRequiredString(input, 'taskId'),
    );
    const updated = await this.tasks.submitForReview(task.id);
    return toAgentTaskProjection(updated);
  }
}

function pickAllowedUpdate(input: Record<string, unknown>): {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
} {
  const patch: {
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
  } = {};
  if (input.title !== undefined) patch.title = readRequiredString(input, 'title');
  if (input.description !== undefined) {
    patch.description = readOptionalString(input, 'description') ?? '';
  }
  if (input.priority !== undefined) {
    const priority = readOptionalTaskPriority(input);
    if (!priority) {
      throw AgentAccessException.validationFailed('priority is invalid');
    }
    patch.priority = priority;
  }
  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      patch.dueDate = null;
    } else {
      patch.dueDate = readOptionalIsoDate(input, 'dueDate') ?? null;
    }
  }
  for (const field of Object.keys(patch)) {
    if (!isTaskAgentUpdateAllowedField(field)) {
      throw AgentAccessException.validationFailed(`Unknown field: ${field}`);
    }
  }
  if (Object.keys(patch).length === 0) {
    throw AgentAccessException.validationFailed(
      `No allowlisted fields to update. Allowed: ${TASK_AGENT_UPDATE_ALLOWED_FIELDS.join(', ')}`,
    );
  }
  return patch;
}
