import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

export type CatalogFunctionGradation = {
  id: string;
  label: string;
};

export type GradationSelectionState = Readonly<Record<string, string>>;

export const EMPTY_GRADATION_SELECTION: GradationSelectionState = {};

/**
 * Volumes a card is sold at, in catalog order. A card with one volume returns none, and the server
 * then resolves the volume itself from the kind of product.
 */
export function catalogFunctionGradations(
  item: DeliveryFunctionOperationalDto,
): readonly CatalogFunctionGradation[] {
  return [...(item.tiers ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((tier) => ({ id: tier.id, label: tier.label }));
}

export function functionHasGradations(item: DeliveryFunctionOperationalDto): boolean {
  return catalogFunctionGradations(item).length > 0;
}

export function setFunctionGradation(
  current: GradationSelectionState,
  functionId: string,
  tierId: string,
): GradationSelectionState {
  if (current[functionId] === tierId) {
    return selectionWithoutFunction(current, functionId);
  }
  return { ...current, [functionId]: tierId };
}

export function selectionWithoutFunction(
  current: GradationSelectionState,
  functionId: string,
): GradationSelectionState {
  if (!(functionId in current)) return current;
  const next = { ...current };
  delete next[functionId];
  return next;
}

export function toggleFunctionClearsGradation(
  selectedIds: readonly string[],
  selection: GradationSelectionState,
  functionId: string,
): GradationSelectionState {
  if (selectedIds.includes(functionId)) {
    return selectionWithoutFunction(selection, functionId);
  }
  return selection;
}

export function selectFunctionForGradation(
  selectedIds: readonly string[],
  functionId: string,
): string[] {
  return selectedIds.includes(functionId) ? [...selectedIds] : [...selectedIds, functionId];
}

export function tierIdForAdd(
  selection: GradationSelectionState,
  functionId: string,
): string | undefined {
  return selection[functionId];
}
