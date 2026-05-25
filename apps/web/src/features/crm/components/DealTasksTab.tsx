'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EntityItemList,
  QuickCreateTaskDialog,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { taskToItemSummary } from '@/features/tasks/entity-item/task-item-summary';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import type { Deal } from '@/lib/api/deals';

interface DealTasksTabProps {
  deal: Deal;
  onRefresh?: () => void;
}

export function DealTasksTab({ deal, onRefresh }: DealTasksTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const { creatorId, creatorReady } = useTaskCreatorId();

  const projectId = deal.projectId ?? deal.orders?.[0]?.projectId;
  const defaultLinks = useMemo(
    () =>
      projectId
        ? [
            { entityType: 'DEAL', entityId: deal.id },
            { entityType: 'PROJECT', entityId: projectId },
          ]
        : undefined,
    [deal.id, projectId],
  );

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await tasksApi.getAll({
        entityType: 'PROJECT',
        entityId: projectId,
        pageSize: 50,
      });
      setTasks(data.items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const itemSummaries = useMemo(() => tasks.map(taskToItemSummary), [tasks]);

  if (!projectId) {
    return (
      <EntityItemList
        items={[]}
        variant={viewVariant}
        onOpen={onOpenItem}
        emptyIcon={CheckSquare}
        emptyTitle="Tasks"
        emptyDescription="Link a project to this deal to create and view tasks."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:border-sky-800 dark:text-sky-400"
          disabled={creatorReady && !creatorId}
          title={creatorReady && !creatorId ? 'Employee profile required' : undefined}
          onClick={() => setQuickCreateOpen(true)}
        >
          <Plus size={14} />
          Create Task
        </Button>
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel="Task list view"
        />
      </div>

      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        onCreated={() => {
          void fetchTasks();
          onRefresh?.();
        }}
      />

      {loading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Loading tasks...</p>
      ) : (
        <EntityItemList
          items={itemSummaries}
          variant={viewVariant}
          onOpen={onOpenItem}
          emptyIcon={CheckSquare}
          emptyTitle="Tasks"
          emptyDescription="No tasks yet. Create one to track work for this deal."
        />
      )}
    </div>
  );
}
