'use client';

import type { Deal } from '@/lib/api/deals';
import { CRM_TASK_ENTITY_DEAL } from '../utils/crm-entity-task-links';
import { EntityLinkedTasksTab } from './EntityLinkedTasksTab';

interface DealTasksTabProps {
  deal: Deal;
  onCreateOpenChange: (open: boolean) => void;
  tasksRefreshSignal?: number;
}

export function DealTasksTab({ deal, onCreateOpenChange, tasksRefreshSignal }: DealTasksTabProps) {
  return (
    <EntityLinkedTasksTab
      entityType={CRM_TASK_ENTITY_DEAL}
      entityId={deal.id}
      emptyDescription="No tasks yet. Create one to track work for this deal."
      onCreateOpenChange={onCreateOpenChange}
      tasksRefreshSignal={tasksRefreshSignal}
    />
  );
}
