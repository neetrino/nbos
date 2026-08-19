'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckSquare } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  EntityItemList,
  useOpenEntityItemFromSummary,
} from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { taskToItemSummary } from '@/features/tasks/entity-item/task-item-summary';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { useDeliveryWorkSpaceHub } from './use-delivery-work-space-hub';

interface DeliveryItemDetailWorkSpacePanelProps {
  productId: string;
  workSpaceHref: string;
  onCreateOpenChange: (open: boolean) => void;
  tasksRefreshSignal?: number;
}

export function DeliveryItemDetailWorkSpacePanel({
  productId,
  workSpaceHref,
  onCreateOpenChange,
  tasksRefreshSignal = 0,
}: DeliveryItemDetailWorkSpacePanelProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const { preview, activeCountLabel, loading, refetch } = useDeliveryWorkSpaceHub(productId, true);
  const items = useMemo(() => preview.map(taskToItemSummary), [preview]);
  const createDisabled = creatorReady && !creatorId;

  useEffect(() => {
    if (tasksRefreshSignal === 0) return;
    void refetch();
  }, [tasksRefreshSignal, refetch]);

  return (
    <section className="border-border bg-card/50 space-y-4 rounded-xl border p-5">
      <WorkSpaceHubToolbar
        activeCountLabel={activeCountLabel}
        loading={loading}
        workSpaceHref={workSpaceHref}
        createDisabled={createDisabled}
        onCreate={() => onCreateOpenChange(true)}
      />
      <WorkSpaceHubList loading={loading} items={items} onOpenItem={onOpenItem} />
    </section>
  );
}

function WorkSpaceHubToolbar({
  activeCountLabel,
  loading,
  workSpaceHref,
  createDisabled,
  onCreate,
}: {
  activeCountLabel: string;
  loading: boolean;
  workSpaceHref: string;
  createDisabled: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>Work Space</h4>
      {loading ? null : <span className="text-muted-foreground text-sm">{activeCountLabel}</span>}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={createDisabled}
          title={createDisabled ? 'Employee profile required' : undefined}
          onClick={onCreate}
        >
          <CheckSquare size={14} aria-hidden />
          Create task
        </Button>
        <Link
          href={workSpaceHref}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          Open Work Space
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function WorkSpaceHubList({
  loading,
  items,
  onOpenItem,
}: {
  loading: boolean;
  items: ReturnType<typeof taskToItemSummary>[];
  onOpenItem: ReturnType<typeof useOpenEntityItemFromSummary>;
}) {
  if (loading) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading tasks...</p>;
  }
  return (
    <EntityItemList
      items={items}
      variant="list-row"
      onOpen={onOpenItem}
      emptyIcon={CheckSquare}
      emptyTitle="No active tasks"
      emptyDescription="Create a task here or open Work Space for the full board."
    />
  );
}
