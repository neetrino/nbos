import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import type { CoreUnitSlot } from './core-unit-slots';
import { liveNormPair } from './live-norm-pair';
import { displayedSaleAmount, liveSalePrices } from './live-sale-prices';
import { targetKeyForKind } from './sale-price-draft';

export function coreCardSource(slot: CoreUnitSlot) {
  const pair = liveNormPair(slot.productType, slot.rows);
  return pair.draft ?? pair.published;
}

export function coreCardIncludedCount(slot: CoreUnitSlot): number {
  return coreCardSource(slot)?.includedFunctionIds.length ?? 0;
}

export function coreCardSaleAmount(
  slot: CoreUnitSlot,
  salePrices: readonly SalePriceVersionDto[],
): string | null {
  const source = coreCardSource(slot);
  if (!source) return null;
  const pair = liveSalePrices(salePrices, 'CORE', [targetKeyForKind('CORE', source.id)])[0];
  return pair ? displayedSaleAmount(pair) : null;
}
