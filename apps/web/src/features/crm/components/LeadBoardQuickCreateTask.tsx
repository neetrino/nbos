'use client';

import { useMemo } from 'react';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildLeadTaskDefaultLinks } from '../utils/crm-entity-task-links';

interface LeadBoardQuickCreateTaskProps {
  leadId: string | null;
  onClose: () => void;
}

export function LeadBoardQuickCreateTask({ leadId, onClose }: LeadBoardQuickCreateTaskProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const defaultLinks = useMemo(
    () => (leadId ? buildLeadTaskDefaultLinks(leadId) : undefined),
    [leadId],
  );

  return (
    <QuickCreateTaskDialog
      open={leadId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      creatorId={creatorId ?? ''}
      creatorReady={creatorReady}
      defaultLinks={defaultLinks}
    />
  );
}
