'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';

export default function RecurringTasksPage() {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!creatorId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await recurringTasksApi.list(creatorId);
      setTemplates(rows);
      setError(null);
    } catch {
      setError('Recurring templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    if (!creatorReady) return;
    void fetchTemplates();
  }, [creatorReady, fetchTemplates]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Recurring tasks" description="Scheduled task templates">
        <Link href="/tasks" className={buttonVariants({ variant: 'outline' })}>
          Back to Tasks
        </Link>
        <Button disabled={!creatorId} onClick={() => void fetchTemplates()}>
          Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTemplates} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No recurring templates"
          description="Create templates via API or seed data. UI create dialog is next slice."
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-lg border">
          {templates.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground text-sm">
                  {row.frequency} · every {row.interval} · next{' '}
                  {row.nextCreateAt ? new Date(row.nextCreateAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <StatusBadge
                label={row.isActive ? 'Active' : 'Paused'}
                variant={row.isActive ? 'green' : 'gray'}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
