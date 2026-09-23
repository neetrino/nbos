'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { loadCatalogQuery, type CatalogQuerySnapshot } from './load-function-catalog-query';
import type { VisibleSalePrice } from './function-catalog-sale-price';

export function useFunctionCatalogQuery(params: { search: string; status?: string }) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const [items, setItems] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [unitsByFunctionId, setUnitsByFunctionId] = useState<Map<string, number> | undefined>();
  const [salePriceByFunctionId, setSalePriceByFunctionId] = useState<Map<string, VisibleSalePrice>>(
    () => new Map(),
  );
  const { loading, begin, end } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const apply = useCallback((snapshot: CatalogQuerySnapshot) => {
    setItems(snapshot.items);
    setUnitsByFunctionId(snapshot.unitsByFunctionId);
    setSalePriceByFunctionId(snapshot.salePriceByFunctionId);
  }, []);

  const load = useCallback(async () => {
    const hasVisibleItems = itemsRef.current.length > 0;
    begin(hasVisibleItems);
    try {
      const loaded = await loadCatalogQuery({
        search: params.search,
        status: params.status,
        canSeeRules,
        hasVisibleItems,
        onFirstPaint: hasVisibleItems
          ? undefined
          : (snapshot) => {
              apply(snapshot);
              end();
            },
      });
      apply(loaded);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('loadFailed')));
      if (isAccessRevokedApiError(caught)) {
        apply({ items: [], unitsByFunctionId: undefined, salePriceByFunctionId: new Map() });
      }
    } finally {
      end();
    }
  }, [apply, begin, canSeeRules, end, params.search, params.status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, unitsByFunctionId, salePriceByFunctionId, loading, error, reload: load };
}
