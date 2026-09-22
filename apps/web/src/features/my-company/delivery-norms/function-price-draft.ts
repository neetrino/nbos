import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';

export function selectedCatalogFunction(
  catalog: readonly DeliveryFunctionOperationalDto[],
  functionId: string,
): DeliveryFunctionOperationalDto | undefined {
  if (functionId === OPTIONAL_SELECT_NONE) return undefined;
  return catalog.find((item) => item.id === functionId);
}

export function functionPriceTierOptions(
  item: DeliveryFunctionOperationalDto | undefined,
): Array<{ value: string; label: string }> {
  if (!item) return [];
  return item.tiers.map((tier) => ({ value: tier.id, label: tier.label }));
}

export function defaultFunctionPriceTierId(
  item: DeliveryFunctionOperationalDto | undefined,
): string {
  if (item?.tiers.length === 1) {
    return item.tiers[0]?.id ?? OPTIONAL_SELECT_NONE;
  }
  return OPTIONAL_SELECT_NONE;
}

export function resolvedFunctionPriceTierId(
  item: DeliveryFunctionOperationalDto | undefined,
  tierId: string,
): { ok: true; tierId: string | null } | { ok: false } {
  if (!item) return { ok: false };
  if (item.tiers.length === 0) return { ok: true, tierId: null };
  if (tierId === OPTIONAL_SELECT_NONE || !item.tiers.some((tier) => tier.id === tierId)) {
    return { ok: false };
  }
  return { ok: true, tierId };
}

export function resolveFunctionPriceWriteTarget(input: {
  catalog: readonly DeliveryFunctionOperationalDto[];
  functionId: string;
  tierId: string;
  locked?: { functionId: string; tierId: string | null } | null;
}):
  | { ok: true; functionId: string; tierId: string | null }
  | { ok: false; error: 'function' | 'tier' } {
  if (input.locked) {
    return { ok: true, functionId: input.locked.functionId, tierId: input.locked.tierId };
  }
  const selected = selectedCatalogFunction(input.catalog, input.functionId);
  if (!selected) {
    return { ok: false, error: 'function' };
  }
  const resolvedTier = resolvedFunctionPriceTierId(selected, input.tierId);
  if (!resolvedTier.ok) {
    return { ok: false, error: 'tier' };
  }
  return { ok: true, functionId: input.functionId, tierId: resolvedTier.tierId };
}

export function functionPriceRowTitle(
  catalogTitle: string,
  tierId: string | null,
  tiers: ReadonlyArray<{ id: string; label: string }>,
): string {
  if (!tierId) return catalogTitle;
  const tier = tiers.find((item) => item.id === tierId);
  return tier ? `${catalogTitle} · ${tier.label}` : catalogTitle;
}
