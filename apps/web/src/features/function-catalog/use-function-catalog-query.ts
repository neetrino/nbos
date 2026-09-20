'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { usePermission } from '@/lib/permissions';
import { loadCatalogUnitsIfPermitted } from './function-catalog-units';

export function useFunctionCatalogQuery(params: { search: string; status?: string }) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const [items, setItems] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [unitsByFunctionId, setUnitsByFunctionId] = useState<Map<string, number> | undefined>();
  const { loading, begin, end } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async () => {
    begin(itemsRef.current.length > 0);
    try {
      const nextItems = await deliveryFunctionsApi.listAll({
        search: params.search || undefined,
        status: params.status,
      });
      setItems(nextItems);
      setError(null);
      setUnitsByFunctionId(
        await loadCatalogUnitsIfPermitted(canSeeRules, () => deliveryNormsApi.listFunctionPrices()),
      );
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('loadFailed')));
      if (isAccessRevokedApiError(caught)) {
        setItems([]);
        setUnitsByFunctionId(undefined);
      }
    } finally {
      end();
    }
  }, [begin, canSeeRules, end, params.search, params.status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, unitsByFunctionId, loading, error, reload: load };
}
