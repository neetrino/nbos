import {
  ACTIVE_FUNCTION_STATUS,
  MATERIALIZED_PLAN_STATE,
  TERMINAL_DELIVERY_STATUSES,
} from './function-catalog.constants';

export type CatalogSelectable = { id: string; status: string };

export function isCatalogFunctionSelectable(
  item: CatalogSelectable,
  alreadyAddedIds: ReadonlySet<string>,
): boolean {
  return item.status === ACTIVE_FUNCTION_STATUS && !alreadyAddedIds.has(item.id);
}

export function toggleCatalogSelection(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

export function isTerminalDeliveryStatus(status: string): boolean {
  return (TERMINAL_DELIVERY_STATUSES as readonly string[]).includes(status);
}

export function canAddFunctionsToConfiguration(input: {
  enrolled: boolean;
  canEdit: boolean;
  deliveryStatus: string | null;
}): boolean {
  if (!input.enrolled || !input.canEdit) return false;
  if (input.deliveryStatus === null) return false;
  return !isTerminalDeliveryStatus(input.deliveryStatus);
}

/**
 * After the plan is materialized a scope change is money that moves, so canon requires an explicit
 * reason from whoever makes it.
 */
export function isPlanMaterialized(planState: string | undefined): boolean {
  return planState === MATERIALIZED_PLAN_STATE;
}

export function canConfirmSelection(input: {
  selectedCount: number;
  requireReason: boolean;
  reason: string;
  saving: boolean;
}): boolean {
  if (input.saving || input.selectedCount === 0) return false;
  return !input.requireReason || input.reason.trim().length > 0;
}

export function addFeatureMessageKey(
  code: string | undefined,
): 'alreadySelected' | 'closedReadOnly' | null {
  if (code === 'FUNCTION_ALREADY_SELECTED') return 'alreadySelected';
  if (code === 'FINANCIAL_ALLOCATION_LOCKED') return 'closedReadOnly';
  return null;
}
