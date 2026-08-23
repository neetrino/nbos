'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import {
  aiAdminUsageApi,
  type AiBudgetLimitView,
  type AiExecutionView,
} from '@/lib/api/ai-admin-usage';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';

export function UsagePanel() {
  const [executions, setExecutions] = useState<AiExecutionView[]>([]);
  const [budgets, setBudgets] = useState<AiBudgetLimitView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextExecutions, nextBudgets] = await Promise.all([
        aiAdminUsageApi.listExecutions(),
        aiAdminUsageApi.listBudgets(),
      ]);
      setExecutions(nextExecutions);
      setBudgets(nextBudgets);
      setError(null);
    } catch {
      setError('Usage records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Budgets</h2>
        {budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No budget limits configured yet.</p>
        ) : (
          budgets.map((budget) => (
            <article key={budget.id} className="border-border bg-card rounded-xl border p-4">
              <p className="text-sm font-semibold">{budget.name}</p>
              <p className="text-muted-foreground text-xs">
                {budget.scopeType} · {budget.metric} · {budget.period} · {budget.ceiling}
                {budget.currency ? ` ${budget.currency}` : ''} · {budget.behavior}
              </p>
            </article>
          ))
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recent executions</h2>
        {executions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No executions recorded"
            description="Capability invocations and future model calls appear here with actor, model and cost attribution. Prompt bodies are never stored."
          />
        ) : (
          executions.map((execution) => (
            <article key={execution.id} className="border-border bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{execution.capabilityKey ?? execution.kind}</p>
                <StatusBadge
                  label={execution.status}
                  variant={agentStateVariant(execution.status)}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {execution.actor.actorType} · {execution.channel ?? 'n/a'} ·{' '}
                {formatTimestamp(execution.startedAt)}
                {execution.latencyMs !== null ? ` · ${execution.latencyMs}ms` : ''}
              </p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                corr={execution.correlationId ?? 'n/a'}
                {execution.modelId ? ` · model=${execution.modelId.slice(0, 8)}` : ''}
                {execution.fallbackOccurred ? ` · fallback ${execution.fallbackReason}` : ''}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
