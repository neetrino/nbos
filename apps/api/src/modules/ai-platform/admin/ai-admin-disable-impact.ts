import type { InternalAiAgentView } from '../internal-agents/internal-agent.mapper';
import type { AiModelView } from '../models/ai-model.mapper';
import type { AiModelPolicyView } from '../policies/ai-model-policy.mapper';

export const AI_ADMIN_DISABLE_IMPACT_KINDS = ['model', 'policy', 'provider'] as const;
export type AiAdminDisableImpactKind = (typeof AI_ADMIN_DISABLE_IMPACT_KINDS)[number];

export interface AiAdminDisableImpact {
  kind: AiAdminDisableImpactKind;
  id: string;
  policies: Array<{ id: string; name: string; status: string }>;
  agents: Array<{ id: string; name: string; status: string }>;
}

export function isDisableImpactKind(value: string): value is AiAdminDisableImpactKind {
  return (AI_ADMIN_DISABLE_IMPACT_KINDS as readonly string[]).includes(value);
}

export function toDisableImpact(params: {
  kind: AiAdminDisableImpactKind;
  id: string;
  models: AiModelView[];
  policies: AiModelPolicyView[];
  agents: InternalAiAgentView[];
}): AiAdminDisableImpact {
  const modelIds = new Set(affectedModelIds(params));
  const policies = params.policies.filter((policy) =>
    params.kind === 'policy'
      ? policy.id === params.id
      : policy.candidates.some((candidate) => modelIds.has(candidate.modelId)),
  );
  const policyIds = new Set(policies.map((policy) => policy.id));
  const agents = params.agents.filter(
    (agent) => agent.modelPolicyId !== null && policyIds.has(agent.modelPolicyId),
  );
  return {
    kind: params.kind,
    id: params.id,
    policies: policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      status: policy.status,
    })),
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
    })),
  };
}

function affectedModelIds(params: {
  kind: AiAdminDisableImpactKind;
  id: string;
  models: AiModelView[];
  policies: AiModelPolicyView[];
}): string[] {
  if (params.kind === 'model') {
    return [params.id];
  }
  if (params.kind === 'provider') {
    return params.models
      .filter((model) => model.connectionId === params.id)
      .map((model) => model.id);
  }
  const policy = params.policies.find((item) => item.id === params.id);
  return policy ? policy.candidates.map((candidate) => candidate.modelId) : [];
}
