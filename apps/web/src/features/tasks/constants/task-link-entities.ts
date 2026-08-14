/** Task link entity types used in the sheet (display + editable delivery context). */

export const TASK_LINK_ENTITY_LABELS: Record<string, string> = {
  PROJECT: 'Project',
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
  ORDER: 'Order',
  DEAL: 'Deal',
  INVOICE: 'Invoice',
  SUPPORT_TICKET: 'Ticket',
  WORK_SPACE: 'Work Space',
  WORKSPACE: 'Work Space',
};

/** Only these can be connected/disconnected from the task sheet. */
export const TASK_EDITABLE_LINK_TYPES = ['PROJECT', 'PRODUCT'] as const;

export type TaskEditableLinkType = (typeof TASK_EDITABLE_LINK_TYPES)[number];

export function isTaskEditableLinkType(entityType: string): entityType is TaskEditableLinkType {
  return entityType === 'PROJECT' || entityType === 'PRODUCT';
}

export function taskLinkEntityLabel(entityType: string): string {
  return TASK_LINK_ENTITY_LABELS[entityType] ?? entityType;
}
