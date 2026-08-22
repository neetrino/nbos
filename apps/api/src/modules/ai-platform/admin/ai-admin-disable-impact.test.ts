import { describe, expect, it } from 'vitest';
import { toDisableImpact } from './ai-admin-disable-impact';
import type { InternalAiAgentView } from '../internal-agents/internal-agent.mapper';
import type { AiModelView } from '../models/ai-model.mapper';
import type { AiModelPolicyView } from '../policies/ai-model-policy.mapper';

function model(id: string, connectionId: string): AiModelView {
  return { id, connectionId } as AiModelView;
}

function policy(id: string, name: string, modelId: string): AiModelPolicyView {
  return {
    id,
    name,
    status: 'ACTIVE',
    candidates: [{ id: `c-${id}`, modelId, role: 'PRIMARY', priority: 0, enabled: true }],
  } as AiModelPolicyView;
}

function agent(id: string, name: string, modelPolicyId: string): InternalAiAgentView {
  return { id, name, status: 'ACTIVE', modelPolicyId } as InternalAiAgentView;
}

describe('toDisableImpact', () => {
  const models = [model('m1', 'conn-1'), model('m2', 'conn-2')];
  const policies = [policy('p1', 'Chat', 'm1'), policy('p2', 'Other', 'm2')];
  const agents = [agent('a1', 'Inbox', 'p1'), agent('a2', 'Draft', 'p2')];

  it('names policies and agents that depend on a model', () => {
    const impact = toDisableImpact({ kind: 'model', id: 'm1', models, policies, agents });
    expect(impact.policies.map((item) => item.name)).toEqual(['Chat']);
    expect(impact.agents.map((item) => item.name)).toEqual(['Inbox']);
  });

  it('names agents that depend on a policy', () => {
    const impact = toDisableImpact({ kind: 'policy', id: 'p1', models, policies, agents });
    expect(impact.policies.map((item) => item.id)).toEqual(['p1']);
    expect(impact.agents.map((item) => item.name)).toEqual(['Inbox']);
  });

  it('walks provider → models → policies → agents', () => {
    const impact = toDisableImpact({ kind: 'provider', id: 'conn-1', models, policies, agents });
    expect(impact.policies.map((item) => item.name)).toEqual(['Chat']);
    expect(impact.agents.map((item) => item.name)).toEqual(['Inbox']);
  });
});
