'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, PageHero, StatusBadge } from '@/components/shared';
import { automationApi, type AutomationRulesCatalog } from '@/lib/api/automation';

export default function TasksAutomationPage() {
  const [catalog, setCatalog] = useState<AutomationRulesCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await automationApi.getRulesCatalog();
      setCatalog(data);
      setError(null);
    } catch {
      setError('Automation catalog could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Automation & blueprints"
        trailing={
          <Link href="/tasks" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Back to Tasks
          </Link>
        }
      />
      <p className="text-muted-foreground text-sm">
        Event-triggered rules (code) vs product launch task packs (blueprints)
      </p>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : catalog ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Automation rules</h2>
            <ul className="divide-border border-border divide-y rounded-lg border">
              {catalog.automationRules.map((rule) => (
                <li key={rule.code} className="space-y-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{rule.code}</span>
                    <StatusBadge label={rule.module} variant="gray" />
                  </div>
                  <p className="text-muted-foreground text-sm">{rule.trigger}</p>
                  <p className="text-sm">{rule.description}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              Task blueprint product types
            </h2>
            <ul className="border-border flex flex-wrap gap-2 rounded-lg border p-4">
              {catalog.blueprintProductTypes.map((type) => (
                <li key={type}>
                  <StatusBadge label={type} variant="blue" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
