import { useMemo } from 'react';
import type {
  CatalogSalePriceRow,
  VisibleSalePrice,
} from '@/features/function-catalog/function-catalog-sale-price';
import type { DealQuoteDto } from '@/lib/api/delivery-deal-quote';
import {
  quoteSaleMissing,
  quoteSaleTotal,
  quoteUnitsTotal,
  visibleCoreSalePrice,
  visibleQuoteItemPrices,
} from './quote-totals';

type DealConstructorMoneyInput = {
  quote: DealQuoteDto | null;
  saleVersions: readonly CatalogSalePriceRow[];
  coreUnits: number | undefined;
  extraUnitsByFunctionId: Map<string, number> | undefined;
  canSeeUnits: boolean;
};

export type DealConstructorMoney = {
  saleTotal: string | null;
  unitsTotal: number | undefined;
  extraSalePrices: Map<string, VisibleSalePrice>;
  coreSalePrice: VisibleSalePrice | undefined;
  saleMissing: 'core' | 'extra' | null;
};

export function computeDealConstructorMoney(
  input: DealConstructorMoneyInput,
): DealConstructorMoney {
  const items = input.quote?.items ?? [];
  const coreVersionId = input.quote?.coreProfileVersionId ?? null;
  const priced = { items, versions: input.saleVersions, canViewDraft: input.canSeeUnits };
  return {
    saleTotal: quoteSaleTotal({ ...priced, coreVersionId }),
    unitsTotal: input.canSeeUnits
      ? quoteUnitsTotal({
          coreUnits: input.coreUnits,
          extraUnits: items.map((item) => input.extraUnitsByFunctionId?.get(item.functionId)),
        })
      : undefined,
    extraSalePrices: visibleQuoteItemPrices(priced),
    coreSalePrice: visibleCoreSalePrice({
      coreVersionId,
      versions: input.saleVersions,
      canViewDraft: input.canSeeUnits,
    }),
    saleMissing: quoteSaleMissing({ ...priced, coreVersionId }),
  };
}

export function useDealConstructorMoney(input: DealConstructorMoneyInput): DealConstructorMoney {
  const { quote, saleVersions, coreUnits, extraUnitsByFunctionId, canSeeUnits } = input;
  return useMemo(
    () =>
      computeDealConstructorMoney({
        quote,
        saleVersions,
        coreUnits,
        extraUnitsByFunctionId,
        canSeeUnits,
      }),
    [canSeeUnits, coreUnits, extraUnitsByFunctionId, quote, saleVersions],
  );
}
