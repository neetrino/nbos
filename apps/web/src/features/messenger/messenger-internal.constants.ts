export const MESSENGER_INTERNAL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'deal', label: 'Deal' },
  { id: 'project', label: 'Project' },
  { id: 'dev', label: 'Dev' },
  { id: 'tasks', label: 'Tasks' },
] as const;

export type MessengerInternalTabId = (typeof MESSENGER_INTERNAL_TABS)[number]['id'];

export const MESSENGER_ENSURE_TYPE_BY_ENTITY = {
  PROJECT: 'PROJECT_GENERAL',
  PRODUCT: 'PRODUCT',
  DEAL: 'DEAL',
  TASK: 'TASK',
} as const;

export const MESSENGER_CONVERSATION_TYPE_LABEL: Record<string, string> = {
  PROJECT_GENERAL: 'Project',
  PRODUCT: 'Product',
  DEAL: 'Deal',
  TASK: 'Task',
  DIRECT: 'Direct',
  INTERNAL_GROUP: 'Group',
};
