import type { ExternalAgentView } from '../agents/external-agent.mapper';
import type { AiModelPolicyView } from '../policies/ai-model-policy.mapper';
import type { AiProviderConnectionView } from '../providers/ai-provider-connection.mapper';

export interface AiAdminCountBucket {
  total: number;
  active: number;
  disabled: number;
  revoked: number;
  expired: number;
}

export interface AiAdminAttentionItem {
  kind: 'EXTERNAL_AGENT' | 'PROVIDER_CONNECTION';
  id: string;
  name: string;
  reason: string;
}

export interface AiAdminOverview {
  externalAgents: AiAdminCountBucket;
  providers: Omit<AiAdminCountBucket, 'expired'>;
  modelPolicies: { total: number; active: number; disabled: number };
  attention: AiAdminAttentionItem[];
  pendingApprovals: number;
  recentActivity: unknown[];
}

export function toOverviewCounts(
  agents: ExternalAgentView[],
  providers: AiProviderConnectionView[],
  policies: AiModelPolicyView[],
): Omit<AiAdminOverview, 'pendingApprovals' | 'recentActivity'> {
  return {
    externalAgents: countAgents(agents),
    providers: countProviders(providers),
    modelPolicies: {
      total: policies.length,
      active: policies.filter((item) => item.status === 'ACTIVE').length,
      disabled: policies.filter((item) => item.status === 'DISABLED').length,
    },
    attention: [...agentAttention(agents), ...providerAttention(providers)],
  };
}

function countAgents(agents: ExternalAgentView[]): AiAdminCountBucket {
  return {
    total: agents.length,
    active: agents.filter((item) => item.state === 'ACTIVE').length,
    disabled: agents.filter((item) => item.state === 'DISABLED').length,
    revoked: agents.filter((item) => item.state === 'REVOKED').length,
    expired: agents.filter((item) => item.state === 'EXPIRED').length,
  };
}

function countProviders(
  providers: AiProviderConnectionView[],
): Omit<AiAdminCountBucket, 'expired'> {
  return {
    total: providers.length,
    active: providers.filter((item) => item.status === 'ACTIVE').length,
    disabled: providers.filter((item) => item.status === 'DISABLED').length,
    revoked: providers.filter((item) => item.status === 'REVOKED').length,
  };
}

function agentAttention(agents: ExternalAgentView[]): AiAdminAttentionItem[] {
  return agents
    .filter(
      (item) => item.state === 'REVOKED' || item.state === 'DISABLED' || item.state === 'EXPIRED',
    )
    .map((item) => ({
      kind: 'EXTERNAL_AGENT',
      id: item.id,
      name: item.name,
      reason: item.state,
    }));
}

function providerAttention(providers: AiProviderConnectionView[]): AiAdminAttentionItem[] {
  return providers
    .filter((item) => item.status === 'REVOKED' || item.status === 'DISABLED')
    .map((item) => ({
      kind: 'PROVIDER_CONNECTION',
      id: item.id,
      name: item.name,
      reason: item.status,
    }));
}
