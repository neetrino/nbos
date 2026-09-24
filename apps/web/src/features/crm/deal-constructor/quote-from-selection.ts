import {
  EMPTY_GRADATION_SELECTION,
  selectFunctionForGradation,
  setFunctionGradation,
} from '@/features/function-catalog/function-catalog-gradation';
import { toggleCatalogSelection } from '@/features/function-catalog/function-catalog-select';
import { VOLUME_FACTOR_STANDARD } from '@nbos/shared';
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

function keptVolume(
  quote: DealQuoteDto,
  functionId: string,
): Pick<DealQuoteItemDto, 'volumeFactor' | 'volumeReason'> {
  const current = quote.items.find((item) => item.functionId === functionId);
  return {
    volumeFactor: current?.volumeFactor ?? VOLUME_FACTOR_STANDARD,
    volumeReason: current?.volumeReason ?? null,
  };
}

export function quoteWithCoreVolume(
  quote: DealQuoteDto,
  volumeFactor: string,
  volumeReason: string | null,
): DealQuoteDto {
  return { ...quote, coreVolumeFactor: volumeFactor, coreVolumeReason: volumeReason };
}

export function quoteWithFunctionVolume(
  quote: DealQuoteDto,
  functionId: string,
  volumeFactor: string,
  volumeReason: string | null,
): DealQuoteDto {
  return {
    ...quote,
    items: quote.items.map((item) =>
      item.functionId === functionId ? { ...item, volumeFactor, volumeReason } : item,
    ),
  };
}

export function quoteWithExtrasVolume(
  quote: DealQuoteDto,
  includedFunctionIds: readonly string[],
  volumeFactor: string,
  volumeReason: string | null,
): DealQuoteDto {
  const included = new Set(includedFunctionIds);
  return {
    ...quote,
    items: quote.items.map((item) =>
      included.has(item.functionId) ? item : { ...item, volumeFactor, volumeReason },
    ),
  };
}

function quoteFromSelection(
  quote: DealQuoteDto,
  selectedIds: readonly string[],
  gradations: Record<string, string>,
): DealQuoteDto {
  const items: DealQuoteItemDto[] = selectedIds.map((id) => ({
    functionId: id,
    tierId: gradations[id] ?? null,
    ...keptVolume(quote, id),
  }));
  return { ...quote, appliedCollectionId: null, items };
}
