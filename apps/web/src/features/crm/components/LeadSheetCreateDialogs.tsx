'use client';

import { useMemo } from 'react';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { CRM_TASK_ENTITY_LEAD } from '../utils/crm-entity-task-links';
import type { Lead } from '@/lib/api/leads';

interface LeadSheetCreateDialogsProps {
  lead: Lead;
  taskCreateOpen: boolean;
  onTaskCreateOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  onTaskCreated?: () => void;
}

/** Parent-owned task create dialog for Lead sheet tab + and in-tab Create. */
export function LeadSheetCreateDialogs({
  lead,
  taskCreateOpen,
  onTaskCreateOpenChange,
  onRefresh,
  onTaskCreated,
}: LeadSheetCreateDialogsProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const defaultLinks = useMemo(
    () => [{ entityType: CRM_TASK_ENTITY_LEAD, entityId: lead.id }],
    [lead.id],
  );

  return (
    <QuickCreateTaskDialog
      open={taskCreateOpen}
      onOpenChange={onTaskCreateOpenChange}
      creatorId={creatorId ?? ''}
      creatorReady={creatorReady}
      defaultLinks={defaultLinks}
      forceNestedBackdrop
      onCreated={() => {
        onTaskCreated?.();
        onRefresh?.();
      }}
    />
  );
}
