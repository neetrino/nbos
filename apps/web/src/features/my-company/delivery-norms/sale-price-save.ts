import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { parseMoneyAmount } from '@/lib/format/money';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import type { LiveSalePrice } from './live-sale-prices';
import { messageFromCaught } from './message-from-caught';
import { parseSalePriceTargetKey, salePriceDraftBody } from './sale-price-draft';

export function plainSaleAmount(amount: string | null | undefined): string {
  if (!amount) return '';
  const value = parseMoneyAmount(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.trunc(value));
}

export async function saveSalePriceDraft(input: {
  pair: LiveSalePrice;
  nextAmount: string;
  fallback: string;
  onError: (message: string) => void;
  onChanged: () => void;
}): Promise<void> {
  try {
    if (input.pair.draft) {
      await deliveryCatalogStructureApi.updateSalePriceDraft(input.pair.draft.id, {
        amountPerUnit: input.nextAmount.trim(),
      });
    } else {
      const parsed = parseSalePriceTargetKey(input.pair.targetKey);
      if (!parsed) {
        input.onError(input.fallback);
        return;
      }
      await deliveryCatalogStructureApi.createSalePriceDraft(
        salePriceDraftBody(parsed.kind, parsed.id, {
          amountPerUnit: input.nextAmount.trim(),
          effectiveFrom: dateInputToIso(todayDateInputValue()),
        }),
      );
    }
    input.onChanged();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  }
}
