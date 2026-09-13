'use client';

import { useTranslations } from 'next-intl';
import type { Deal } from '@/lib/api/deals';
import { CRM_TASK_ENTITY_DEAL } from '../utils/crm-entity-task-links';
import { EntityLinkedTasksTab } from './EntityLinkedTasksTab';

interface DealTasksTabProps {
  deal: Deal;
  onCreateOpenChange: (open: boolean) => void;
  tasksRefreshSignal?: number;
}

export function DealTasksTab({ deal, onCreateOpenChange, tasksRefreshSignal }: DealTasksTabProps) {
  const t = useTranslations('crm');
  return (
    <EntityLinkedTasksTab
      entityType={CRM_TASK_ENTITY_DEAL}
      entityId={deal.id}
      emptyDescription={t('dealSheet.tasksEmptyDescription')}
      onCreateOpenChange={onCreateOpenChange}
      tasksRefreshSignal={tasksRefreshSignal}
    />
  );
}
