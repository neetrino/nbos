import { useMemo, useState } from 'react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { functionPriceTierOptions } from './function-price-draft';
import { initialTierSelection, pairForSelection, pairsForFunction } from './function-unit-focus';
import type { LiveFunctionPrice } from './live-function-prices';
import { liveSalePrices } from './live-sale-prices';
import {
  createEmptyRoleUnitDrafts,
  roleUnitDraftsFromDto,
  type RoleUnitDraftRow,
} from './role-units-draft';
import { targetKeyForKind, type SalePriceTargetKind } from './sale-price-draft';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';

export function draftsForFunctionSelection(
  item: DeliveryFunctionOperationalDto | undefined,
  pairs: LiveFunctionPrice[],
  selection: string,
): RoleUnitDraftRow[] {
  const current = pairForSelection(item, pairs, selection);
  const source = current?.draft ?? current?.published ?? null;
  return source ? roleUnitDraftsFromDto(source.roleUnits) : createEmptyRoleUnitDrafts();
}

export function functionSalePair(
  item: DeliveryFunctionOperationalDto,
  tierId: string,
  salePrices: readonly SalePriceVersionDto[],
) {
  const hasTiers = item.tiers.length > 0;
  if (hasTiers && (tierId === OPTIONAL_SELECT_NONE || tierId === '')) return null;
  const kind: SalePriceTargetKind = hasTiers ? 'TIER' : 'FUNCTION';
  const targetId = hasTiers ? tierId : item.id;
  return liveSalePrices(salePrices, kind, [targetKeyForKind(kind, targetId)])[0] ?? null;
}

export function useFunctionSheetDrafts(
  item: DeliveryFunctionOperationalDto | null,
  pairs: LiveFunctionPrice[],
) {
  const focused = useMemo(() => (item ? pairsForFunction(pairs, item.id) : []), [item, pairs]);
  const initialTier = initialTierSelection(item ?? undefined, focused);
  const [tierId, setTierId] = useState(initialTier);
  const [roleUnits, setRoleUnits] = useState(() =>
    draftsForFunctionSelection(item ?? undefined, focused, initialTier),
  );
  const [seenId, setSeenId] = useState(item?.id ?? null);
  if ((item?.id ?? null) !== seenId) {
    const nextFocused = item ? pairsForFunction(pairs, item.id) : [];
    const nextTier = initialTierSelection(item ?? undefined, nextFocused);
    setSeenId(item?.id ?? null);
    setTierId(nextTier);
    setRoleUnits(draftsForFunctionSelection(item ?? undefined, nextFocused, nextTier));
  }
  const selected = pairForSelection(item ?? undefined, focused, tierId);
  const baseline = draftsForFunctionSelection(item ?? undefined, focused, tierId);
  return {
    focused,
    tierId,
    roleUnits,
    selected,
    tierOptions: functionPriceTierOptions(item ?? undefined),
    unitsDirty: JSON.stringify(roleUnits) !== JSON.stringify(baseline),
    setRoleUnits,
    selectTier: (next: string) => {
      const resolved = next || OPTIONAL_SELECT_NONE;
      setTierId(resolved);
      setRoleUnits(draftsForFunctionSelection(item ?? undefined, focused, resolved));
    },
    resetUnits: () => setRoleUnits(baseline),
  };
}
