import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { listAiCapabilities } from '@nbos/shared';
import { AuditService } from '../../audit/audit.service';
import type { PaginationParams } from '../../audit/audit-log.params';
import { ExternalAgentService } from '../agents/external-agent.service';
import { AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { AgentCredentialService } from '../credentials/agent-credential.service';
import { AgentGrantService } from '../grants/agent-grant.service';
import { InternalAgentService } from '../internal-agents/internal-agent.service';
import { AiModelCatalogService } from '../models/ai-model-catalog.service';
import { AiModelPolicyService } from '../policies/ai-model-policy.service';
import { AiProviderConnectionService } from '../providers/ai-provider-connection.service';
import {
  isDisableImpactKind,
  toDisableImpact,
  type AiAdminDisableImpact,
  type AiAdminDisableImpactKind,
} from './ai-admin-disable-impact';
import {
  AI_ADMIN_AUDIT_ENTITY_TYPES,
  AI_ADMIN_OVERVIEW_ACTIVITY_LIMIT,
} from './ai-admin.constants';
import { toOverviewCounts, type AiAdminOverview } from './ai-admin-overview.mapper';
import { toWorkspaceAccessRows } from './ai-admin-workspace-access.mapper';

/**
 * Read-side composition for employee admin. Mutations stay on Chat 2/5 services.
 */
@Injectable()
export class AiAdminQueryService {
  constructor(
    private readonly agents: ExternalAgentService,
    private readonly grants: AgentGrantService,
    private readonly credentials: AgentCredentialService,
    private readonly providers: AiProviderConnectionService,
    private readonly policies: AiModelPolicyService,
    private readonly catalog: AiModelCatalogService,
    private readonly internalAgents: InternalAgentService,
    private readonly audit: AuditService,
  ) {}

  async overview(): Promise<AiAdminOverview> {
    const [agents, providers, policies, activity] = await Promise.all([
      this.agents.listAll(),
      this.providers.listAll(),
      this.policies.listAll(),
      this.audit.findRecentByEntityTypes([...AI_ADMIN_AUDIT_ENTITY_TYPES], {
        page: 1,
        pageSize: AI_ADMIN_OVERVIEW_ACTIVITY_LIMIT,
      }),
    ]);
    return {
      ...toOverviewCounts(agents, providers, policies),
      pendingApprovals: 0,
      recentActivity: activity.items,
    };
  }

  listCapabilities() {
    return listAiCapabilities().map((capability) => ({
      key: capability.key,
      description: capability.description,
      access: capability.access,
      risk: capability.risk,
      allowedScopeTypes: capability.allowedScopeTypes,
    }));
  }

  async getExternalAgentBundle(agentId: string) {
    const agent = await this.agents.findById(agentId);
    if (!agent) {
      throw new NotFoundException('External agent not found');
    }
    const [capabilities, scopes, credentials] = await Promise.all([
      this.grants.listCapabilities(agentId),
      this.grants.listScopes(agentId),
      this.credentials.listForAgent(agentId),
    ]);
    return { agent, capabilities, scopes, credentials };
  }

  async listExternalAgentSummaries() {
    const agents = await this.agents.listAll();
    return Promise.all(agents.map((agent) => this.getExternalAgentBundle(agent.id)));
  }

  async listWorkspaceAccess(workspaceId: string) {
    const scopes = await this.grants.listActiveWorkspaceScopes(workspaceId);
    const rows = await Promise.all(
      scopes.map(async (scope) => {
        const [agent, capabilities] = await Promise.all([
          this.agents.findById(scope.agentId),
          this.grants.listCapabilities(scope.agentId),
        ]);
        return { scope, agent, capabilities };
      }),
    );
    return toWorkspaceAccessRows(workspaceId, rows);
  }

  async getInternalAgentBundle(agentId: string) {
    const agent = await this.internalAgents.findById(agentId);
    if (!agent) {
      throw new NotFoundException('Internal agent not found');
    }
    return agent;
  }

  async getExternalAgentActivity(agentId: string, pagination: PaginationParams = {}) {
    const bundle = await this.getExternalAgentBundle(agentId);
    const refs = [
      { entityType: AI_AUDIT_ENTITY.agent, entityId: agentId },
      ...bundle.credentials.map((item) => ({
        entityType: AI_AUDIT_ENTITY.credential,
        entityId: item.id,
      })),
      ...bundle.capabilities.map((item) => ({
        entityType: AI_AUDIT_ENTITY.capabilityGrant,
        entityId: item.id,
      })),
      ...bundle.scopes.map((item) => ({
        entityType: AI_AUDIT_ENTITY.resourceScope,
        entityId: item.id,
      })),
    ];
    return this.audit.findRecentByEntityRefs(refs, pagination);
  }

  async getDisableImpact(kind: string, id: string): Promise<AiAdminDisableImpact> {
    if (!isDisableImpactKind(kind)) {
      throw new BadRequestException('Unknown disable impact kind');
    }
    if (!id.trim()) {
      throw new BadRequestException('id is required');
    }
    const typedKind: AiAdminDisableImpactKind = kind;
    const [models, policies, agents] = await Promise.all([
      this.catalog.listAll(),
      this.policies.listAll(),
      this.internalAgents.listAll(),
    ]);
    return toDisableImpact({ kind: typedKind, id, models, policies, agents });
  }
}
