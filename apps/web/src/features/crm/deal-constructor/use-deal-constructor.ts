'use client';

import { useCallback, useState } from 'react';
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
import {
  quoteWithCoreVolume,
  quoteWithExtrasVolume,
  quoteWithFunctionVolume,
  quoteWithGradation,
  quoteWithoutAddedExtras,
  quoteWithToggledFunction,
} from './quote-from-selection';
import { useDealConstructorMoney } from './use-deal-constructor-money';

export function useDealConstructor(
  dealId: string,
  productType: string,
  productCategory: string | null,
) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const { can } = usePermission();
  const canSeeUnits = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const catalog = useFunctionCatalogQuery({ search: '', status: ACTIVE_FUNCTION_STATUS });
  const loaded = useDealConstructorQuery(
    dealId,
    productType,
    productCategory,
    canSeeUnits,
    t('loadFailed'),
  );
  const writes = useDealConstructorWrites(dealId, loaded.setQuote, loaded.setError, t);
  const money = useDealConstructorMoney({
    quote: loaded.quote,
    saleVersions: loaded.saleVersions,
    coreUnits: loaded.coreUnits,
    extraUnitsByFunctionId: catalog.unitsByFunctionId,
    includedFunctionIds: loaded.includedFunctionIds,
    canSeeUnits,
  });

  return {
    catalog,
    quote: loaded.quote,
    collections: loaded.collections,
    coreTitle: loaded.coreTitle,
    includedFunctionIds: loaded.includedFunctionIds,
    error: loaded.error,
    saving: writes.saving,
    canSeeUnits,
    ...money,
    ...quoteEdits(loaded.quote, loaded.includedFunctionIds, writes.persist),
    applyCollection: writes.applyCollection,
    reload: loaded.reload,
  };
}

function quoteEdits(
  quote: DealQuoteDto | null,
  includedFunctionIds: readonly string[],
  persist: (next: DealQuoteDto) => Promise<void>,
) {
  return {
    toggle: (functionId: string) => {
      if (quote) void persist(quoteWithToggledFunction(quote, functionId));
    },
    selectGradation: (functionId: string, tierId: string) => {
      if (quote) void persist(quoteWithGradation(quote, functionId, tierId));
    },
    clearExtras: () => {
      if (quote) void persist(quoteWithoutAddedExtras(quote, includedFunctionIds));
    },
    setCoreVolume: (volumeFactor: string, volumeReason: string | null) => {
      if (quote) void persist(quoteWithCoreVolume(quote, volumeFactor, volumeReason));
    },
    setFunctionVolume: (functionId: string, volumeFactor: string, volumeReason: string | null) => {
      if (quote)
        void persist(quoteWithFunctionVolume(quote, functionId, volumeFactor, volumeReason));
    },
    setExtrasVolume: (volumeFactor: string, volumeReason: string | null) => {
      if (quote) {
        void persist(quoteWithExtrasVolume(quote, includedFunctionIds, volumeFactor, volumeReason));
      }
    },
  };
}

function useDealConstructorQuery(
  dealId: string,
  productType: string,
  productCategory: string | null,
  canSeeUnits: boolean,
  loadFailed: string,
) {
  const queryKey = `${dealId}:${productType}:${productCategory ?? ''}:${canSeeUnits ? 'units' : 'sale'}`;
  const query = useQuery({
    queryKey: ['deal-constructor', dealId, productType, productCategory, canSeeUnits],
    queryFn: () => loadDealConstructor(dealId, productType, productCategory, canSeeUnits),
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
    coreTitle: data?.coreTitle ?? null,
    includedFunctionIds: data?.includedFunctionIds ?? [],
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
            coreVolumeFactor: next.coreVolumeFactor,
            coreVolumeReason: next.coreVolumeReason,
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
  productCategory: string | null,
  canSeeUnits: boolean,
): Promise<{
  quote: DealQuoteDto;
  collections: Awaited<ReturnType<typeof deliveryCatalogStructureApi.listCollections>>;
  saleVersions: CatalogSalePriceRow[];
  coreUnits: number | undefined;
  coreTitle: string | null;
  includedFunctionIds: string[];
}> {
  const [quote, collections, saleVersions] = await Promise.all([
    deliveryDealQuoteApi.get(dealId, { productType, productCategory }),
    deliveryCatalogStructureApi.listCollections(productType),
    deliveryCatalogStructureApi.listSalePrices(),
  ]);
  const core = await loadPublishedCore(quote.coreProfileVersionId, canSeeUnits);
  return {
    quote,
    collections,
    saleVersions,
    coreUnits: core.units,
    coreTitle: core.title,
    includedFunctionIds: core.includedFunctionIds,
  };
}

async function loadPublishedCore(
  coreVersionId: string | null,
  canSeeUnits: boolean,
): Promise<{ units: number | undefined; title: string | null; includedFunctionIds: string[] }> {
  if (!coreVersionId) return { units: undefined, title: null, includedFunctionIds: [] };
  try {
    const rows = await deliveryNormsApi.listBaseProfiles();
    const profile = rows.find((row) => row.id === coreVersionId) ?? null;
    return {
      units: canSeeUnits ? profileUnitsTotal(profile) : undefined,
      title: profile?.profileKey ?? null,
      includedFunctionIds: profile?.includedFunctionIds ?? [],
    };
  } catch {
    return { units: undefined, title: null, includedFunctionIds: [] };
  }
}
