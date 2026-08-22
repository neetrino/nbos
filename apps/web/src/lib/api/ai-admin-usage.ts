import { adminGet, adminPost } from './ai-admin-http';

export interface AiExecutionView {
  id: string;
  kind: string;
  status: string;
  actor: { actorType: string; actorId: string };
  externalAgentId: string | null;
  internalAgentId: string | null;
  providerConnectionId: string | null;
  modelId: string | null;
  modelPolicyId: string | null;
  capabilityKey: string | null;
  channel: string | null;
  correlationId: string | null;
  latencyMs: number | null;
  retryCount: number;
  fallbackOccurred: boolean;
  fallbackReason: string | null;
  inputUnits: number | null;
  outputUnits: number | null;
  estimatedCost: string | null;
  providerReportedCost: string | null;
  currency: string | null;
  pricingVersion: string | null;
  errorCode: string | null;
  startedAt: string;
}

export interface AiBudgetLimitView {
  id: string;
  name: string;
  scopeType: string;
  scopeId: string;
  metric: string;
  period: string;
  ceiling: string;
  currency: string | null;
  behavior: string;
  enabled: boolean;
}

export const aiAdminUsageApi = {
  listExecutions: () => adminGet<AiExecutionView[]>('/api/ai-admin/usage/executions'),
  listBudgets: () => adminGet<AiBudgetLimitView[]>('/api/ai-admin/usage/budgets'),
  createBudget: (body: {
    name: string;
    scopeType: string;
    scopeId: string;
    metric: string;
    period: string;
    ceiling: string;
    currency?: string | null;
    behavior: string;
  }) => adminPost<AiBudgetLimitView>('/api/ai-admin/usage/budgets', body),
};
