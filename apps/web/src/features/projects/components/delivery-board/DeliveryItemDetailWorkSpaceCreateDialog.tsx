'use client';

import { useMemo } from 'react';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildDeliveryWorkSpaceTaskLinks } from './delivery-work-space-hub';
import { useDeliveryWorkSpaceHub } from './use-delivery-work-space-hub';

interface DeliveryItemDetailWorkSpaceCreateDialogProps {
  productId: string;
  sheetOpen: boolean;
  taskCreateOpen: boolean;
  onTaskCreateOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

/** Parent-owned Work Space task create — shared by tab + and in-panel Create task. */
export function DeliveryItemDetailWorkSpaceCreateDialog({
  productId,
  sheetOpen,
  taskCreateOpen,
  onTaskCreateOpenChange,
  onCreated,
}: DeliveryItemDetailWorkSpaceCreateDialogProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const { workspaceId } = useDeliveryWorkSpaceHub(productId, sheetOpen);
  const defaultLinks = useMemo(() => buildDeliveryWorkSpaceTaskLinks(productId), [productId]);

  return (
    <QuickCreateTaskDialog
      open={taskCreateOpen}
      onOpenChange={onTaskCreateOpenChange}
      creatorId={creatorId ?? ''}
      creatorReady={creatorReady}
      defaultLinks={defaultLinks}
      defaultWorkspaceId={workspaceId ?? undefined}
      forceNestedBackdrop
      onCreated={onCreated}
    />
  );
}
