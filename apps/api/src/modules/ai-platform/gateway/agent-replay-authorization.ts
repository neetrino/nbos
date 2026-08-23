import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { AiCapabilityDefinition } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { resolveCanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService } from '../policy/agent-policy.service';
import { readOptionalString, readRequiredString } from './agent-capability.input';
import { workspacePolicyTarget } from './agent-scope-target';
import { AgentTaskAccess } from './agent-task-access';

/**
 * Re-authorizes a sensitive action that is about to be answered from a stored
 * idempotency record instead of a fresh domain call.
 *
 * `05-AI-Data-Security-and-Audit.md` requires delayed sensitive writes to
 * revalidate actor status and applicable grants before commit. A replay is the
 * one Phase 1 path where the answer is produced without reaching the handler
 * that would otherwise assert policy, so a capability grant or resource scope
 * revoked after the original call would still be honoured on retry.
 */
@Injectable()
export class AgentReplayAuthorization {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policy: AgentPolicyService,
    private readonly access: AgentTaskAccess,
  ) {}

  async assertStillAuthorized(
    agent: AuthenticatedAgent,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
  ): Promise<void> {
    const taskId = readOptionalString(input, 'taskId');
    if (taskId) {
      await this.access.requireAuthorizedTask(agent, capability.key, taskId);
      return;
    }
    await this.assertWorkspaceStillAuthorized(agent, capability.key, input);
  }

  private async assertWorkspaceStillAuthorized(
    agent: AuthenticatedAgent,
    capabilityKey: string,
    input: Record<string, unknown>,
  ): Promise<void> {
    const workspaceId = readRequiredString(input, 'workspaceId');
    const workspace = await resolveCanonicalWorkSpace(this.prisma, workspaceId);
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey,
      target: workspace ? workspacePolicyTarget(workspace) : { workspaceId },
    });
    if (!workspace) {
      throw AgentAccessException.resourceNotAvailable();
    }
  }
}
