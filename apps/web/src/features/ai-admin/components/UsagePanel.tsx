'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gauge, Wallet } from 'lucide-react';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import {
  aiAdminUsageApi,
  type AiBudgetLimitView,
  type AiExecutionView,
} from '@/lib/api/ai-admin-usage';
import { cn } from '@/lib/utils';
import { iconForCapabilityKey } from '../ai-admin-icons';
import { AI_ADMIN_DENSE_ROW_CLASS, AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import { formatTimestamp } from '../format';
import { executionStatusVariant } from '../status-badge-map';
import { AiAdminIconTile } from './AiAdminIconTile';
import { AiAdminSection } from './AiAdminSection';

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
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminSection
        icon={Wallet}
        title="Budgets"
        summary={budgets.length === 0 ? 'None' : `${budgets.length}`}
        collapsible
        defaultOpen={budgets.length > 0}
      >
        {budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            No budget limits configured yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {budgets.map((budget) => (
              <BudgetRow key={budget.id} budget={budget} />
            ))}
          </ul>
        )}
      </AiAdminSection>
      <AiAdminSection
        icon={Gauge}
        title="Recent executions"
        summary={executions.length === 0 ? 'None' : `${executions.length}`}
        summaryVariant={executions.length > 0 ? 'emerald' : 'default'}
        collapsible
        defaultOpen={executions.length > 0}
      >
        {executions.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Capability invocations appear here with actor, model and cost. Prompt bodies are never
            stored.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {executions.map((execution) => (
              <ExecutionRow key={execution.id} execution={execution} />
            ))}
          </ul>
        )}
      </AiAdminSection>
    </div>
  );
}

function BudgetRow({ budget }: { budget: AiBudgetLimitView }) {
  return (
    <li className={cn(AI_ADMIN_DENSE_ROW_CLASS, 'justify-between')}>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{budget.name}</p>
        <p className="text-muted-foreground truncate text-[11px]">
          {budget.scopeType} · {budget.metric} · {budget.period} · {budget.ceiling}
          {budget.currency ? ` ${budget.currency}` : ''}
        </p>
      </div>
      <StatusBadge label={budget.behavior} variant="blue" className="shrink-0 self-center" />
    </li>
  );
}

function ExecutionRow({ execution }: { execution: AiExecutionView }) {
  const key = execution.capabilityKey ?? execution.kind;
  return (
    <li className={cn(AI_ADMIN_DENSE_ROW_CLASS, 'justify-between')}>
      <div className="flex min-w-0 items-center gap-2">
        <AiAdminIconTile icon={iconForCapabilityKey(key)} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{key}</p>
          <p className="text-muted-foreground truncate text-[11px]">
            {execution.actor.actorType} · {execution.channel ?? 'n/a'} ·{' '}
            {formatTimestamp(execution.startedAt)}
            {execution.latencyMs !== null ? ` · ${execution.latencyMs}ms` : ''}
          </p>
        </div>
      </div>
      <StatusBadge
        label={execution.status}
        variant={executionStatusVariant(execution.status)}
        className="shrink-0 self-center"
      />
    </li>
  );
}
