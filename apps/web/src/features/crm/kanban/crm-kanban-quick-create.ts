import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import { LEAD_NEW_STAGE_KEY } from '@/features/crm/constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { leadsApi } from '@/lib/api/leads';

export const DEAL_INBOX_STAGE_KEY = 'START_CONVERSATION';

export function createLeadKanbanQuickCreateConfig(
  onCreated: (lead: Lead) => Promise<void> | void,
): KanbanColumnQuickCreateConfig<Lead> {
  return {
    isEnabled: (column) => column.key === LEAD_NEW_STAGE_KEY,
    buttonLabel: 'Quick Lead',
    titlePlaceholder: 'Title',
    titleAriaLabel: 'Lead title',
    onCreate: async ({ title }) => {
      const lead = await leadsApi.create({ name: title });
      await onCreated(lead);
    },
  };
}

export function createDealKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
): KanbanColumnQuickCreateConfig<unknown> {
  return {
    isEnabled: (column) => column.key === DEAL_INBOX_STAGE_KEY,
    buttonLabel: 'Quick Deal',
    onOpenDialog: onOpenCreateDialog,
  };
}
