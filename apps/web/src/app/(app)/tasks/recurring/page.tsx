'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageHero, StatusBadge } from '@/components/shared';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { CreateRecurringTaskDialog } from '@/features/tasks/components/CreateRecurringTaskDialog';

export default function RecurringTasksPage() {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
      <PageHero
        title="Recurring tasks"
        trailing={
          <>
            <Link href="/tasks" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Back to Tasks
            </Link>
            <Button type="button" disabled={!creatorId} onClick={() => void fetchTemplates()}>
              Refresh
            </Button>
            <Button type="button" disabled={!creatorId} onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              New template
            </Button>
          </>
        }
      />
      <p className="text-muted-foreground text-sm">Scheduled task templates</p>

      <CreateRecurringTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        creatorId={creatorId ?? ''}
        onCreated={(row) => setTemplates((prev) => [row, ...prev])}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTemplates} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No recurring templates"
          description="Create a recurring template to spawn tasks on a schedule."
          action={
            <Button disabled={!creatorId} onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              New template
            </Button>
          }
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
