import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { isTimestampPast } from '../agents/external-agent-state';
import { PRISMA_TOKEN } from '../../../database.module';
import { AgentGrantService } from '../grants/agent-grant.service';
import { AgentPolicyService, type AgentPolicyQuery } from '../policy/agent-policy.service';
import {
  findProductWorkSpace,
  listDiscoverableWorkSpaces,
  resolveCanonicalWorkSpace,
} from '../../tasks/work-space-canonical.op';
import type { CanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { readOptionalString, readPage, readPageSize } from './agent-capability.input';
import { workspacePolicyTarget } from './agent-scope-target';
import { toAgentWorkspaceProjection } from './agent-task-projection';

@Injectable()
export class AgentWorkspaceHandler {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly policy: AgentPolicyService,
    private readonly grants: AgentGrantService,
  ) {}

  async read(agent: AuthenticatedAgent, input: Record<string, unknown>): Promise<unknown> {
    const workspaceId = readOptionalString(input, 'workspaceId');
    if (workspaceId) {
      return this.readOne(agent, workspaceId);
    }
    return this.listAuthorized(agent, readPage(input), readPageSize(input));
  }

  private async readOne(agent: AuthenticatedAgent, workspaceId: string) {
    const workspace = await resolveCanonicalWorkSpace(this.prisma, workspaceId);
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey: 'workspaces.read',
      target: workspace ? workspacePolicyTarget(workspace) : { workspaceId },
    });
    if (!workspace) {
      throw AgentAccessException.resourceNotAvailable();
    }
    return toAgentWorkspaceProjection(workspace);
  }

  private async listAuthorized(agent: AuthenticatedAgent, page: number, pageSize: number) {
    const workspaces = await this.collectAuthorizedWorkspaces(agent);
    await this.assertListAccess(agent, workspaces);
    const total = workspaces.length;
    const start = (page - 1) * pageSize;
    return {
      items: workspaces.slice(start, start + pageSize).map(toAgentWorkspaceProjection),
      meta: {
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  private async assertListAccess(
    agent: AuthenticatedAgent,
    workspaces: CanonicalWorkSpace[],
  ): Promise<void> {
    const query = {
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey: 'workspaces.read',
      target: workspaces[0] ? workspacePolicyTarget(workspaces[0]) : { workspaceId: 'unscoped' },
    };
    if (workspaces.length > 0) {
      await this.policy.assertAllowed(query);
      return;
    }
    await this.assertEmptyListAccess(query);
  }

  /**
   * An empty authorized set is a successful empty page, not a 404.
   * Any other DENY (disabled, ungranted, …) must go through assertAllowed so
   * ON_DENY audit fires.
   */
  private async assertEmptyListAccess(query: AgentPolicyQuery): Promise<void> {
    const decision = await this.policy.evaluate(query);
    if (decision.outcome === 'ALLOW') return;
    if (decision.outcome === 'DENY' && decision.reason === 'RESOURCE_OUT_OF_SCOPE') return;
    await this.policy.assertAllowed(query);
  }

  private async collectAuthorizedWorkspaces(
    agent: AuthenticatedAgent,
  ): Promise<CanonicalWorkSpace[]> {
    const now = new Date();
    const scopes = (await this.grants.listScopes(agent.agentId)).filter(
      (scope) => !scope.revokedAt && !isTimestampPast(scope.expiresAt, now),
    );
    const byId = new Map<string, CanonicalWorkSpace>();
    for (const scope of scopes) {
      const rows = await this.workspacesForScope(scope.scopeType, scope.scopeId);
      for (const row of rows) {
        byId.set(row.id, row);
      }
    }
    return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private async workspacesForScope(
    scopeType: string,
    scopeId: string,
  ): Promise<CanonicalWorkSpace[]> {
    if (scopeType === 'ORGANIZATION') {
      return listDiscoverableWorkSpaces(this.prisma, {});
    }
    if (scopeType === 'PROJECT') {
      return listDiscoverableWorkSpaces(this.prisma, { projectId: scopeId });
    }
    if (scopeType === 'PRODUCT') {
      const product = await findProductWorkSpace(this.prisma, scopeId);
      return product ? [product] : [];
    }
    if (scopeType === 'WORKSPACE') {
      const workspace = await resolveCanonicalWorkSpace(this.prisma, scopeId);
      return workspace ? [workspace] : [];
    }
    return [];
  }
}
