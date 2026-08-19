'use client';

import { useMemo, useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ENTITY_ITEM_VIEW_OPTIONS,
  EntityItemList,
  QuickCreateTaskDialog,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  type EntityItemVariant,
} from '@/components/shared';
import { taskToItemSummary } from '@/features/tasks/entity-item/task-item-summary';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { useEntityLinkedTasks } from '../hooks/use-entity-linked-tasks';
import type { TaskEntityLink } from '../utils/crm-entity-task-links';

interface EntityLinkedTasksTabProps {
  entityType: string;
  entityId: string;
  extraLinks?: TaskEntityLink[];
  onRefresh?: () => void;
  emptyDescription: string;
}

export function EntityLinkedTasksTab({
  entityType,
  entityId,
  extraLinks,
  onRefresh,
  emptyDescription,
}: EntityLinkedTasksTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const { creatorId, creatorReady } = useTaskCreatorId();
  const { tasks, loading, fetchTasks } = useEntityLinkedTasks(entityType, entityId);
  const defaultLinks = useMemo(
    () => [{ entityType, entityId }, ...(extraLinks ?? [])],
    [entityType, entityId, extraLinks],
  );
  const itemSummaries = useMemo(() => tasks.map(taskToItemSummary), [tasks]);

  return (
    <div className="space-y-4">
      <EntityLinkedTasksToolbar
        creatorId={creatorId}
        creatorReady={creatorReady}
        viewVariant={viewVariant}
        onViewVariantChange={setViewVariant}
        onCreate={() => setQuickCreateOpen(true)}
      />
      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        forceNestedBackdrop
        onCreated={() => {
          void fetchTasks();
          onRefresh?.();
        }}
      />
      <EntityLinkedTasksList
        loading={loading}
        items={itemSummaries}
        viewVariant={viewVariant}
        emptyDescription={emptyDescription}
        onOpenItem={onOpenItem}
      />
    </div>
  );
}

function EntityLinkedTasksToolbar({
  creatorId,
  creatorReady,
  viewVariant,
  onViewVariantChange,
  onCreate,
}: {
  creatorId: string | null;
  creatorReady: boolean;
  viewVariant: EntityItemVariant;
  onViewVariantChange: (value: EntityItemVariant) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:border-sky-800 dark:text-sky-400"
        disabled={creatorReady && !creatorId}
        title={creatorReady && !creatorId ? 'Employee profile required' : undefined}
        onClick={onCreate}
      >
        <Plus size={14} />
        Create Task
      </Button>
      <ViewModeSwitch
        value={viewVariant}
        onChange={onViewVariantChange}
        options={ENTITY_ITEM_VIEW_OPTIONS}
        ariaLabel="Task list view"
      />
    </div>
  );
}

function EntityLinkedTasksList({
  loading,
  items,
  viewVariant,
  emptyDescription,
  onOpenItem,
}: {
  loading: boolean;
  items: ReturnType<typeof taskToItemSummary>[];
  viewVariant: EntityItemVariant;
  emptyDescription: string;
  onOpenItem: ReturnType<typeof useOpenEntityItemFromSummary>;
}) {
  if (loading) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading tasks...</p>;
  }
  return (
    <EntityItemList
      items={items}
      variant={viewVariant}
      onOpen={onOpenItem}
      emptyIcon={CheckSquare}
      emptyTitle="Tasks"
      emptyDescription={emptyDescription}
    />
  );
}
