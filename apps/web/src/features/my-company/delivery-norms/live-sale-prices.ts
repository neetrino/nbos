import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { liveNormPair, type LiveNormPair } from './live-norm-pair';
import { parseSalePriceTargetKey, type SalePriceTargetKind } from './sale-price-draft';

export type LiveSalePrice = LiveNormPair<SalePriceVersionDto> & {
  targetKey: string;
};

export function liveSalePrices(
  rows: readonly SalePriceVersionDto[],
  kind: SalePriceTargetKind,
  knownKeys: readonly string[] = [],
): LiveSalePrice[] {
  const ofKind = rows.filter((row) => {
    if (row.status === 'ARCHIVED') {
      return false;
    }
    return parseSalePriceTargetKey(row.targetKey)?.kind === kind;
  });
  const keys = uniqueTargetKeys(knownKeys, ofKind);
  return keys.map((targetKey) => ({
    targetKey,
    ...liveNormPair(
      targetKey,
      ofKind.filter((row) => row.targetKey === targetKey),
    ),
  }));
}

function uniqueTargetKeys(
  knownKeys: readonly string[],
  rows: readonly SalePriceVersionDto[],
): string[] {
  const keys: string[] = [];
  for (const key of knownKeys) {
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  for (const row of rows) {
    if (!keys.includes(row.targetKey)) {
      keys.push(row.targetKey);
    }
  }
  return keys;
}

export function displayedSaleAmount(pair: LiveSalePrice): string | null {
  return pair.published?.amountPerUnit ?? pair.draft?.amountPerUnit ?? null;
}
