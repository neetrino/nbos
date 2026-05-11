import type { DeliveryActiveStage } from './project-delivery-board-actions';

export const DELIVERY_KANBAN_COL_PREFIX = 'delivery-col:';
export const DELIVERY_KANBAN_CARD_PREFIX = 'delivery-card:';

export function deliveryKanbanColId(stage: DeliveryActiveStage): string {
  return `${DELIVERY_KANBAN_COL_PREFIX}${stage}`;
}

export function deliveryKanbanCardId(itemKey: string): string {
  return `${DELIVERY_KANBAN_CARD_PREFIX}${itemKey}`;
}

export function parseDeliveryKanbanColId(id: string): DeliveryActiveStage | null {
  if (!id.startsWith(DELIVERY_KANBAN_COL_PREFIX)) return null;
  const stage = id.slice(DELIVERY_KANBAN_COL_PREFIX.length);
  if (stage === 'STARTING' || stage === 'DEVELOPMENT' || stage === 'QA' || stage === 'TRANSFER') {
    return stage;
  }
  return null;
}

export function parseDeliveryKanbanCardItemKey(id: string): string | null {
  if (!id.startsWith(DELIVERY_KANBAN_CARD_PREFIX)) return null;
  return id.slice(DELIVERY_KANBAN_CARD_PREFIX.length);
}
