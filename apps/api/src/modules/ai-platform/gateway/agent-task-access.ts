import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { AiDataClassification } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { TasksService } from '../../tasks/tasks.service';
import { resolveCanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService } from '../policy/agent-policy.service';
import { taskPolicyTarget } from './agent-scope-target';

@Injectable()
export class AgentTaskAccess {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policy: AgentPolicyService,
    private readonly tasks: TasksService,
  ) {}

  async requireAuthorizedTask(
    agent: AuthenticatedAgent,
    capabilityKey: string,
    taskId: string,
    classification?: AiDataClassification | null,
  ) {
    const task = await this.loadTask(taskId);
    const workspace = task?.workspaceId
      ? await resolveCanonicalWorkSpace(this.prisma, task.workspaceId)
      : null;
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey,
      target: workspace
        ? taskPolicyTarget(workspace, taskId)
        : { resourceType: 'TASK', resourceId: taskId },
      targetDataClassification: classification,
    });
    if (!task || !workspace) {
      throw AgentAccessException.resourceNotAvailable();
    }
    return { task, workspace };
  }

  async loadTask(taskId: string) {
    try {
      const task = await this.tasks.findById(taskId);
      return task.trashedAt ? null : task;
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
