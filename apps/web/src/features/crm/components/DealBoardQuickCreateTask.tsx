'use client';

import { useMemo } from 'react';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildDealTaskDefaultLinks } from '../utils/crm-entity-task-links';

interface DealBoardQuickCreateTaskProps {
  dealId: string | null;
  projectId?: string | null;
  onClose: () => void;
}

export function DealBoardQuickCreateTask({
  dealId,
  projectId,
  onClose,
}: DealBoardQuickCreateTaskProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const defaultLinks = useMemo(
    () => (dealId ? buildDealTaskDefaultLinks(dealId, projectId) : undefined),
    [dealId, projectId],
  );

  return (
    <QuickCreateTaskDialog
      open={dealId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      creatorId={creatorId ?? ''}
      creatorReady={creatorReady}
      defaultLinks={defaultLinks}
    />
  );
}
