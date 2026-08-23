import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { TasksDbClient } from '../../tasks/tasks-db-client';
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

export interface PreparedAgentTaskCreate {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  workspaceId: string;
  creatorId: string;
  actor: { type: string; id: string };
}

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

  /** Short committed statement. Must run before the task+checkpoint transaction. */
  async reserveCreateCode(): Promise<string> {
    return this.tasks.reserveCode();
  }

  /**
   * Policy and owner lookup. Must run before `BEGIN` so the interactive
   * transaction does not hold a pool connection while it waits for another
   * (`poolMax` is 5; six concurrent creates otherwise deadlock).
   */
  async prepareCreate(
    agent: AuthenticatedAgent,
    input: Record<string, unknown>,
  ): Promise<PreparedAgentTaskCreate> {
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
    return {
      title: readRequiredString(input, 'title'),
      description: readOptionalString(input, 'description'),
      priority: readOptionalTaskPriority(input),
      dueDate: readOptionalIsoDate(input, 'dueDate'),
      workspaceId: workspace.id,
      creatorId: owner.ownerId,
      actor: { type: agent.actor.actor.type, id: agent.actor.actor.id },
    };
  }

  async commitPreparedCreate(
    prepared: PreparedAgentTaskCreate,
    reservedCode: string | undefined,
    tx?: TasksDbClient,
  ) {
    const created = await this.tasks.create(
      {
        title: prepared.title,
        description: prepared.description,
        priority: prepared.priority,
        dueDate: prepared.dueDate,
        workspaceId: prepared.workspaceId,
        creatorId: prepared.creatorId,
      },
      prepared.actor,
      tx,
      reservedCode,
    );
    return toAgentTaskProjection(created);
  }

  async create(agent: AuthenticatedAgent, input: Record<string, unknown>, tx?: TasksDbClient) {
    const prepared = await this.prepareCreate(agent, input);
    return this.commitPreparedCreate(prepared, readOptionalReservedCode(input), tx);
  }

  async update(agent: AuthenticatedAgent, input: Record<string, unknown>, tx?: TasksDbClient) {
    const taskId = readRequiredString(input, 'taskId');
    const { task } = await this.access.requireAuthorizedTask(agent, 'tasks.update', taskId);
    const expectedUpdatedAt = readRequiredIsoDateTime(input, 'expectedUpdatedAt');
    const patch = pickAllowedUpdate(input);
    const updated = await this.tasks.update(task.id, patch, undefined, expectedUpdatedAt, tx);
    return toAgentTaskProjection(updated);
  }

  async start(agent: AuthenticatedAgent, input: Record<string, unknown>, tx?: TasksDbClient) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.start',
      readRequiredString(input, 'taskId'),
    );
    const updated = await this.tasks.start(task.id, undefined, tx);
    return toAgentTaskProjection(updated);
  }

  async comment(agent: AuthenticatedAgent, input: Record<string, unknown>, tx?: TasksDbClient) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.comment',
      readRequiredString(input, 'taskId'),
    );
    const entry = await this.discussion.addEntry(
      task.id,
      agent.actor,
      readRequiredString(input, 'body'),
      undefined,
      tx,
    );
    return { id: entry.id, createdAt: entry.createdAt.toISOString() };
  }

  async submitReview(
    agent: AuthenticatedAgent,
    input: Record<string, unknown>,
    tx?: TasksDbClient,
  ) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.submit_review',
      readRequiredString(input, 'taskId'),
    );
    const updated = await this.tasks.submitForReview(task.id, undefined, undefined, tx);
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

/** Set by the gateway after a committed reserve — never an agent-supplied field. */
function readOptionalReservedCode(input: Record<string, unknown>): string | undefined {
  const value = input.reservedTaskCode;
  return typeof value === 'string' && value.trim() ? value : undefined;
}
