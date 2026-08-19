'use client';

import type { Lead } from '@/lib/api/leads';
import { CRM_TASK_ENTITY_LEAD } from '../utils/crm-entity-task-links';
import { EntityLinkedTasksTab } from './EntityLinkedTasksTab';

interface LeadTasksTabProps {
  lead: Lead;
  onRefresh?: () => void;
}

export function LeadTasksTab({ lead, onRefresh }: LeadTasksTabProps) {
  return (
    <EntityLinkedTasksTab
      entityType={CRM_TASK_ENTITY_LEAD}
      entityId={lead.id}
      onRefresh={onRefresh}
      emptyDescription="No tasks yet. Create one to track work for this lead."
    />
  );
}
