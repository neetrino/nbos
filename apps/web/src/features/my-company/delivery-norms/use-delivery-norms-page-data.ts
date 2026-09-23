import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryBaseProfileFinancialDto,
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
  DeliveryRoleRateFinancialDto,
} from '@nbos/shared';
import {
  deliveryCatalogStructureApi,
  type SalePriceVersionDto,
} from '@/lib/api/delivery-catalog-structure';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { deliveryNormsApi, type DeliveryEnrollmentSetting } from '@/lib/api/delivery-norms';
import { isAccessRevokedApiError } from '@/lib/api-errors';
import { messageFromCaught } from './message-from-caught';

export type DeliveryNormsPageData = {
  rates: DeliveryRoleRateFinancialDto[];
  profiles: DeliveryBaseProfileFinancialDto[];
  prices: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  enrollment: DeliveryEnrollmentSetting | null;
  salePrices: SalePriceVersionDto[];
};

const EMPTY_DATA: DeliveryNormsPageData = {
  rates: [],
  profiles: [],
  prices: [],
  catalog: [],
  enrollment: null,
  salePrices: [],
};

export function useDeliveryNormsPageData(enabled: boolean) {
  const t = useTranslations('hr.deliveryNorms');
  const [data, setData] = useState<DeliveryNormsPageData>(EMPTY_DATA);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setData(EMPTY_DATA);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchDeliveryNorms();
      setData((prev) => ({ ...next, catalog: prev.catalog }));
      setError(null);
      fillFunctionCatalog(setData);
    } catch (caught) {
      // Rates and units must not stay on screen once the server refuses the read.
      if (isAccessRevokedApiError(caught)) {
        setData(EMPTY_DATA);
      }
      setError(messageFromCaught(caught, t('errors.load')));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, setError, load };
}

async function fetchDeliveryNorms(): Promise<Omit<DeliveryNormsPageData, 'catalog'>> {
  const [rates, profiles, prices, enrollment, salePrices] = await Promise.all([
    deliveryNormsApi.listRoleRates(),
    deliveryNormsApi.listBaseProfiles(),
    deliveryNormsApi.listFunctionPrices(),
    deliveryNormsApi.getEnrollment(),
    deliveryCatalogStructureApi.listSalePrices(),
  ]);
  return { rates, profiles, prices, enrollment, salePrices };
}

function fillFunctionCatalog(setData: Dispatch<SetStateAction<DeliveryNormsPageData>>): void {
  void deliveryFunctionsApi.listAll().then(
    (catalog) => {
      setData((prev) => ({ ...prev, catalog }));
    },
    () => undefined,
  );
}
