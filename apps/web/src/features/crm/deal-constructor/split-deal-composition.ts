import type { QuoteTotalItem } from './quote-totals';

/** Quote lines whose price and units are already inside the published core. */
export function billableQuoteItems<T extends QuoteTotalItem>(
  items: readonly T[],
  includedFunctionIds: readonly string[],
): T[] {
  if (includedFunctionIds.length === 0) return [...items];
  const included = new Set(includedFunctionIds);
  return items.filter((item) => !included.has(item.functionId));
}

export function splitDealFunctions<T extends { id: string }>(
  catalog: readonly T[],
  selectedIds: ReadonlySet<string>,
  includedFunctionIds: readonly string[],
): { base: T[]; extras: T[] } {
  const included = new Set(includedFunctionIds);
  return {
    base: catalog.filter((item) => included.has(item.id)),
    extras: catalog.filter((item) => selectedIds.has(item.id) && !included.has(item.id)),
  };
}
