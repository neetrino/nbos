import type { DeliveryFunctionPriceFinancialDto } from '@nbos/shared';
import { liveNormPair, type LiveNormPair } from './live-norm-pair';

export type LiveFunctionPrice = LiveNormPair<DeliveryFunctionPriceFinancialDto> & {
  functionId: string;
  tierId: string | null;
};

export function functionPriceClusterKey(functionId: string, tierId: string | null): string {
  return `${functionId}:${tierId ?? ''}`;
}

export function liveFunctionPrices(
  rows: readonly DeliveryFunctionPriceFinancialDto[],
): LiveFunctionPrice[] {
  const active = rows.filter((row) => row.status !== 'ARCHIVED');
  const keys: string[] = [];
  for (const row of active) {
    const key = functionPriceClusterKey(row.functionId, row.tierId);
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys.map((key) => {
    const [functionId, tierId] = splitClusterKey(key);
    return {
      functionId,
      tierId,
      ...liveNormPair(
        key,
        active.filter(
          (row) => row.functionId === functionId && (row.tierId ?? '') === (tierId ?? ''),
        ),
      ),
    };
  });
}

function splitClusterKey(key: string): [string, string | null] {
  const separator = key.indexOf(':');
  const functionId = key.slice(0, separator);
  const tierId = key.slice(separator + 1);
  return [functionId, tierId === '' ? null : tierId];
}
