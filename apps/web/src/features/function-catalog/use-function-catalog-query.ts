'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import {
  loadCatalogExtras,
  loadCatalogPage,
  loadFullCatalog,
  type CatalogExtras,
  type CatalogFilters,
  type CatalogQuerySnapshot,
} from './load-function-catalog-query';
import type { VisibleSalePrice } from './function-catalog-sale-price';

export function useFunctionCatalogQuery(params: {
  search: string;
  status?: string;
  category?: string;
  complete?: boolean;
}) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const snapshot = useCatalogSnapshotState();
  const extrasRef = useRef<CatalogExtras | null>(null);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const { apply, begin, end, setError, setLoadingMore } = snapshot;
  const filters = {
    search: params.search,
    status: params.status,
    category: params.category,
  };

  const reload = useCallback(async () => {
    if (!params.complete) snapshot.clearItems();
    begin(false);
    pageRef.current = 1;
    try {
      const loaded = params.complete
        ? await loadFullCatalog({ filters, canSeeRules })
        : await loadPagedFirst(filters, canSeeRules, extrasRef);
      apply(loaded, false);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('loadFailed')));
      if (isAccessRevokedApiError(caught)) apply(emptySnapshot(), false);
    } finally {
      end();
    }
  }, [
    apply,
    begin,
    canSeeRules,
    end,
    params.category,
    params.complete,
    params.search,
    params.status,
    setError,
    snapshot.clearItems,
    t,
  ]);

  const loadMore = useCallback(async () => {
    if (params.complete || snapshot.loading || loadingMoreRef.current) return;
    if (snapshot.items.length >= snapshot.total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const extras = extrasRef.current ?? (await loadCatalogExtras(canSeeRules));
      extrasRef.current = extras;
      const nextPage = pageRef.current + 1;
      const loaded = await loadCatalogPage({ filters, page: nextPage, canSeeRules, extras });
      pageRef.current = nextPage;
      apply(loaded, true);
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('loadFailed')));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [
    apply,
    canSeeRules,
    params.category,
    params.complete,
    params.search,
    params.status,
    setError,
    setLoadingMore,
    snapshot.items.length,
    snapshot.loading,
    snapshot.total,
    t,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items: snapshot.items,
    total: snapshot.total,
    categoryCounts: snapshot.categoryCounts,
    unitsByFunctionId: snapshot.unitsByFunctionId,
    salePriceByFunctionId: snapshot.salePriceByFunctionId,
    loading: snapshot.loading,
    loadingMore: snapshot.loadingMore,
    hasMore: !params.complete && snapshot.items.length < snapshot.total,
    error: snapshot.error,
    reload,
    loadMore,
  };
}

function useCatalogSnapshotState() {
  const [items, setItems] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [unitsByFunctionId, setUnitsByFunctionId] = useState<Map<string, number> | undefined>();
  const [salePriceByFunctionId, setSalePriceByFunctionId] = useState<Map<string, VisibleSalePrice>>(
    () => new Map(),
  );
  const { loading, begin, end } = useRevalidationState();
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearItems = useCallback(() => setItems([]), []);
  const apply = useCallback((snapshot: CatalogQuerySnapshot, append: boolean) => {
    setItems((current) => (append ? mergeCatalogItems(current, snapshot.items) : snapshot.items));
    setTotal(snapshot.total);
    setCategoryCounts(snapshot.categoryCounts);
    setUnitsByFunctionId(snapshot.unitsByFunctionId);
    setSalePriceByFunctionId((current) =>
      append
        ? new Map([...current, ...snapshot.salePriceByFunctionId])
        : snapshot.salePriceByFunctionId,
    );
  }, []);
  return {
    items,
    total,
    categoryCounts,
    unitsByFunctionId,
    salePriceByFunctionId,
    loading,
    loadingMore,
    error,
    begin,
    end,
    apply,
    clearItems,
    setError,
    setLoadingMore,
  };
}

function mergeCatalogItems(
  current: DeliveryFunctionOperationalDto[],
  incoming: DeliveryFunctionOperationalDto[],
): DeliveryFunctionOperationalDto[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

async function loadPagedFirst(
  filters: CatalogFilters,
  canSeeRules: boolean,
  extrasRef: MutableRefObject<CatalogExtras | null>,
): Promise<CatalogQuerySnapshot> {
  extrasRef.current = await loadCatalogExtras(canSeeRules);
  return loadCatalogPage({ filters, page: 1, canSeeRules, extras: extrasRef.current });
}

function emptySnapshot(): CatalogQuerySnapshot {
  return {
    items: [],
    total: 0,
    categoryCounts: {},
    unitsByFunctionId: undefined,
    salePriceByFunctionId: new Map(),
  };
}
