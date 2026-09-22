import {
  sumPayableRoleUnits,
  type DeliveryFunctionOperationalDto,
  type DeliveryRoleUnitFinancialDto,
} from '@nbos/shared';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveFunctionPrice } from './live-function-prices';

export type FunctionUnitCardModel = {
  id: string;
  title: string;
  iconKey: string;
  unitsTotal: string | null;
  status: string | null;
  draftId: string | null;
  draftRoleUnits: readonly DeliveryRoleUnitFinancialDto[] | null;
};

type TieredFunction = {
  tiers: ReadonlyArray<{ id: string }>;
};

export function pairsForFunction(
  pairs: readonly LiveFunctionPrice[],
  functionId: string,
): LiveFunctionPrice[] {
  return pairs.filter((pair) => pair.functionId === functionId);
}

/** Draft wins over published so the card shows the unsaved vector. */
export function representativePair(pairs: readonly LiveFunctionPrice[]): LiveFunctionPrice | null {
  return pairs.find((pair) => pair.draft) ?? pairs.find((pair) => pair.published) ?? null;
}

export function pairForTier(
  pairs: readonly LiveFunctionPrice[],
  tierId: string | null,
): LiveFunctionPrice | null {
  return pairs.find((pair) => (pair.tierId ?? null) === tierId) ?? null;
}

export function initialTierSelection(
  item: TieredFunction | undefined,
  pairs: readonly LiveFunctionPrice[],
): string {
  const preferred = representativePair(pairs);
  if (preferred?.tierId) return preferred.tierId;
  if (item?.tiers.length === 1) return item.tiers[0]?.id ?? OPTIONAL_SELECT_NONE;
  return OPTIONAL_SELECT_NONE;
}

export function pairForSelection(
  item: TieredFunction | undefined,
  pairs: readonly LiveFunctionPrice[],
  selection: string,
): LiveFunctionPrice | null {
  if (!item || item.tiers.length === 0) return pairForTier(pairs, null);
  if (selection === OPTIONAL_SELECT_NONE) return null;
  return pairForTier(pairs, selection);
}

export function functionUnitCardModel(
  item: Pick<DeliveryFunctionOperationalDto, 'id' | 'title' | 'iconKey'>,
  pairs: readonly LiveFunctionPrice[],
): FunctionUnitCardModel {
  const pair = representativePair(pairs);
  const current = pair?.draft ?? pair?.published ?? null;
  return {
    id: item.id,
    title: item.title,
    iconKey: item.iconKey,
    unitsTotal: current ? sumPayableRoleUnits(current.roleUnits) : null,
    status: current && pair ? liveNormDisplayStatus(pair) : null,
    draftId: pair?.draft?.id ?? null,
    draftRoleUnits: pair?.draft?.roleUnits ?? null,
  };
}
