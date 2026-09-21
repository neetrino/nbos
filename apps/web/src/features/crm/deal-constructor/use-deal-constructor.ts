'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import type { CatalogSalePriceRow } from '@/features/function-catalog/function-catalog-sale-price';
import { ACTIVE_FUNCTION_STATUS } from '@/features/function-catalog/function-catalog.constants';
import { useFunctionCatalogQuery } from '@/features/function-catalog/use-function-catalog-query';
import { getApiErrorMessage } from '@/lib/api-errors';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { deliveryDealQuoteApi, type DealQuoteDto } from '@/lib/api/delivery-deal-quote';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { usePermission } from '@/lib/permissions';
import { profileUnitsTotal } from './published-core-for-type';
import { quoteWithGradation, quoteWithToggledFunction } from './quote-from-selection';
import { quoteSaleTotal, quoteUnitsTotal } from './quote-totals';

export function useDealConstructor(dealId: string, productType: string) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const { can } = usePermission();
  const canSeeUnits = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const catalog = useFunctionCatalogQuery({ search: '', status: ACTIVE_FUNCTION_STATUS });
  const loaded = useDealConstructorQuery(dealId, productType, canSeeUnits, t('loadFailed'));
  const writes = useDealConstructorWrites(dealId, loaded.setQuote, loaded.setError, t);

  return {
    catalog,
    quote: loaded.quote,
    collections: loaded.collections,
    error: loaded.error,
    saving: writes.saving,
    canSeeUnits,
    saleTotal: useMemo(
      () =>
        quoteSaleTotal({
          coreVersionId: loaded.quote?.coreProfileVersionId ?? null,
          items: loaded.quote?.items ?? [],
          versions: loaded.saleVersions,
          canViewDraft: canSeeUnits,
        }),
      [canSeeUnits, loaded.quote, loaded.saleVersions],
    ),
    unitsTotal: useMemo(
      () =>
        canSeeUnits
          ? quoteUnitsTotal({
              coreUnits: loaded.coreUnits,
              extraUnits: (loaded.quote?.items ?? []).map((item) =>
                catalog.unitsByFunctionId?.get(item.functionId),
              ),
            })
          : undefined,
      [canSeeUnits, catalog.unitsByFunctionId, loaded.coreUnits, loaded.quote?.items],
    ),
    toggle: (functionId: string) => {
      if (loaded.quote) void writes.persist(quoteWithToggledFunction(loaded.quote, functionId));
    },
    selectGradation: (functionId: string, tierId: string) => {
      if (loaded.quote) void writes.persist(quoteWithGradation(loaded.quote, functionId, tierId));
    },
    applyCollection: writes.applyCollection,
    reload: loaded.reload,
  };
}

function useDealConstructorQuery(
  dealId: string,
  productType: string,
  canSeeUnits: boolean,
  loadFailed: string,
) {
  const queryKey = `${dealId}:${productType}:${canSeeUnits ? 'units' : 'sale'}`;
  const query = useQuery({
    queryKey: ['deal-constructor', dealId, productType, canSeeUnits],
    queryFn: () => loadDealConstructor(dealId, productType, canSeeUnits),
  });
  const [override, setOverride] = useState<{ key: string; quote: DealQuoteDto } | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const data = query.data;
  const quote = override?.key === queryKey ? override.quote : (data?.quote ?? null);

  return {
    quote,
    collections: data?.collections ?? [],
    saleVersions: data?.saleVersions ?? [],
    coreUnits: data?.coreUnits,
    error: writeError ?? (query.error ? getApiErrorMessage(query.error, loadFailed) : null),
    setQuote: (next: DealQuoteDto) => setOverride({ key: queryKey, quote: next }),
    setError: setWriteError,
    reload: () => {
      setOverride(null);
      setWriteError(null);
      void query.refetch();
    },
  };
}

function useDealConstructorWrites(
  dealId: string,
  setQuote: (quote: DealQuoteDto) => void,
  setError: (message: string | null) => void,
  t: ReturnType<typeof useTranslations<'crm.dealSheet.dealConstructor'>>,
) {
  const [saving, setSaving] = useState(false);

  const persist = useCallback(
    async (next: DealQuoteDto) => {
      setSaving(true);
      try {
        setQuote(
          await deliveryDealQuoteApi.replace(dealId, {
            appliedCollectionId: next.appliedCollectionId,
            items: next.items,
          }),
        );
        setError(null);
      } catch (caught) {
        setError(getApiErrorMessage(caught, t('saveFailed')));
      } finally {
        setSaving(false);
      }
    },
    [dealId, setError, setQuote, t],
  );

  const applyCollection = useCallback(
    async (collectionId: string) => {
      setSaving(true);
      try {
        setQuote(await deliveryDealQuoteApi.applyCollection(dealId, collectionId));
        setError(null);
      } catch (caught) {
        setError(getApiErrorMessage(caught, t('saveFailed')));
      } finally {
        setSaving(false);
      }
    },
    [dealId, setError, setQuote, t],
  );

  return { saving, persist, applyCollection };
}

async function loadDealConstructor(
  dealId: string,
  productType: string,
  canSeeUnits: boolean,
): Promise<{
  quote: DealQuoteDto;
  collections: Awaited<ReturnType<typeof deliveryCatalogStructureApi.listCollections>>;
  saleVersions: CatalogSalePriceRow[];
  coreUnits: number | undefined;
}> {
  const [quote, collections, saleVersions] = await Promise.all([
    deliveryDealQuoteApi.get(dealId),
    deliveryCatalogStructureApi.listCollections(productType),
    deliveryCatalogStructureApi.listSalePrices(),
  ]);
  return {
    quote,
    collections,
    saleVersions,
    coreUnits: canSeeUnits ? await loadCoreUnits(quote.coreProfileVersionId) : undefined,
  };
}

async function loadCoreUnits(coreVersionId: string | null): Promise<number | undefined> {
  if (!coreVersionId) return undefined;
  try {
    const rows = await deliveryNormsApi.listBaseProfiles();
    return profileUnitsTotal(rows.find((row) => row.id === coreVersionId) ?? null);
  } catch {
    return undefined;
  }
}
