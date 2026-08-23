import type { AiAdminDisableImpact } from '@/lib/api/ai-admin';

export const AI_ADMIN_IMPACT_NAME_LIMIT = 8;

export function isDisableImpactConfirmReady(status: {
  hasData: boolean;
  isError: boolean;
  isFetching: boolean;
}): boolean {
  return status.hasData && !status.isError && !status.isFetching;
}

export function formatDisableImpact(impact: AiAdminDisableImpact): string {
  const policies = names(impact.policies.map((item) => item.name));
  const agents = names(impact.agents.map((item) => item.name));
  if (impact.policies.length === 0 && impact.agents.length === 0) {
    return 'No Model Policies or Internal Agents currently depend on this.';
  }
  return `Policies (${impact.policies.length}): ${policies}. Internal Agents (${impact.agents.length}): ${agents}.`;
}

function names(values: string[]): string {
  if (values.length === 0) {
    return 'none';
  }
  const shown = values.slice(0, AI_ADMIN_IMPACT_NAME_LIMIT);
  const extra = values.length - shown.length;
  return extra > 0 ? `${shown.join(', ')} +${extra} more` : shown.join(', ');
}
