import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import { LEAD_NEW_STAGE_KEY } from '@/features/crm/constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { leadsApi } from '@/lib/api/leads';

export const DEAL_INBOX_STAGE_KEY = 'START_CONVERSATION';

export type LeadKanbanQuickCreateCopy = {
  buttonLabel: string;
  titlePlaceholder: string;
  titleAriaLabel: string;
};

export function createLeadKanbanQuickCreateConfig(
  onCreated: (lead: Lead) => Promise<void> | void,
  copy?: LeadKanbanQuickCreateCopy,
): KanbanColumnQuickCreateConfig<Lead> {
  return {
    isEnabled: (column) => column.key === LEAD_NEW_STAGE_KEY,
    hideOnMobile: true,
    buttonLabel: copy?.buttonLabel ?? 'Quick Lead',
    titlePlaceholder: copy?.titlePlaceholder ?? 'Title',
    titleAriaLabel: copy?.titleAriaLabel ?? 'Lead title',
    onCreate: async ({ title }) => {
      const lead = await leadsApi.create({ name: title });
      await onCreated(lead);
    },
  };
}

export type DealKanbanQuickCreateCopy = {
  buttonLabel: string;
};

export function createDealKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
  copy?: DealKanbanQuickCreateCopy,
): KanbanColumnQuickCreateConfig<unknown> {
  return {
    isEnabled: (column) => column.key === DEAL_INBOX_STAGE_KEY,
    hideOnMobile: true,
    buttonLabel: copy?.buttonLabel ?? 'Quick Deal',
    onOpenDialog: onOpenCreateDialog,
  };
}
