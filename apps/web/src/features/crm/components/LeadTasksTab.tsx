'use client';

import { useTranslations } from 'next-intl';
import type { Lead } from '@/lib/api/leads';
import { CRM_TASK_ENTITY_LEAD } from '../utils/crm-entity-task-links';
import { EntityLinkedTasksTab } from './EntityLinkedTasksTab';

interface LeadTasksTabProps {
  lead: Lead;
  onCreateOpenChange: (open: boolean) => void;
  tasksRefreshSignal?: number;
}

export function LeadTasksTab({ lead, onCreateOpenChange, tasksRefreshSignal }: LeadTasksTabProps) {
  const t = useTranslations('crm');
  return (
    <EntityLinkedTasksTab
      entityType={CRM_TASK_ENTITY_LEAD}
      entityId={lead.id}
      emptyDescription={t('leadSheet.tasksEmptyDescription')}
      onCreateOpenChange={onCreateOpenChange}
      tasksRefreshSignal={tasksRefreshSignal}
    />
  );
}
