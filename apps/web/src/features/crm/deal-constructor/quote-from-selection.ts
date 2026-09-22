import {
  EMPTY_GRADATION_SELECTION,
  selectFunctionForGradation,
  setFunctionGradation,
} from '@/features/function-catalog/function-catalog-gradation';
import { toggleCatalogSelection } from '@/features/function-catalog/function-catalog-select';
import type { DealQuoteDto, DealQuoteItemDto } from '@/lib/api/delivery-deal-quote';

export function quoteWithToggledFunction(quote: DealQuoteDto, functionId: string): DealQuoteDto {
  return quoteFromSelection(
    quote,
    toggleCatalogSelection(
      quote.items.map((item) => item.functionId),
      functionId,
    ),
    gradationsFromQuote(quote),
  );
}

/** Drops functions added on top of the base. Included-in-base lines stay on the quote. */
export function quoteWithoutAddedExtras(
  quote: DealQuoteDto,
  includedFunctionIds: readonly string[],
): DealQuoteDto {
  const included = new Set(includedFunctionIds);
  return {
    ...quote,
    appliedCollectionId: null,
    items: quote.items.filter((item) => included.has(item.functionId)),
  };
}

export function quoteWithGradation(
  quote: DealQuoteDto,
  functionId: string,
  tierId: string,
): DealQuoteDto {
  return quoteFromSelection(
    quote,
    selectFunctionForGradation(
      quote.items.map((item) => item.functionId),
      functionId,
    ),
    setFunctionGradation(gradationsFromQuote(quote), functionId, tierId),
  );
}

function gradationsFromQuote(quote: DealQuoteDto): Record<string, string> {
  const next = { ...EMPTY_GRADATION_SELECTION };
  for (const item of quote.items) {
    if (item.tierId) next[item.functionId] = item.tierId;
  }
  return next;
}

function quoteFromSelection(
  quote: DealQuoteDto,
  selectedIds: readonly string[],
  gradations: Record<string, string>,
): DealQuoteDto {
  const items: DealQuoteItemDto[] = selectedIds.map((id) => ({
    functionId: id,
    tierId: gradations[id] ?? null,
  }));
  return { ...quote, appliedCollectionId: null, items };
}
