'use client';

import { useMemo } from 'react';
import type { Deal } from '@/lib/api/deals';
import {
  CRM_TASK_ENTITY_DEAL,
  CRM_TASK_ENTITY_PROJECT,
  resolveDealProjectId,
} from '../utils/crm-entity-task-links';
import { EntityLinkedTasksTab } from './EntityLinkedTasksTab';

interface DealTasksTabProps {
  deal: Deal;
  onRefresh?: () => void;
}

export function DealTasksTab({ deal, onRefresh }: DealTasksTabProps) {
  const projectId = resolveDealProjectId(deal);
  const extraLinks = useMemo(
    () => (projectId ? [{ entityType: CRM_TASK_ENTITY_PROJECT, entityId: projectId }] : undefined),
    [projectId],
  );

  return (
    <EntityLinkedTasksTab
      entityType={CRM_TASK_ENTITY_DEAL}
      entityId={deal.id}
      extraLinks={extraLinks}
      onRefresh={onRefresh}
      emptyDescription="No tasks yet. Create one to track work for this deal."
    />
  );
}
