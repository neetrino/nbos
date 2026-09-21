import { useCallback, useEffect, useState } from 'react';
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
  defaultMultiplier: string | null;
};

const EMPTY_DATA: DeliveryNormsPageData = {
  rates: [],
  profiles: [],
  prices: [],
  catalog: [],
  enrollment: null,
  salePrices: [],
  defaultMultiplier: null,
};

export function useDeliveryNormsPageData() {
  const t = useTranslations('hr.deliveryNorms');
  const [data, setData] = useState<DeliveryNormsPageData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchDeliveryNorms());
      setError(null);
    } catch (caught) {
      // Rates and units must not stay on screen once the server refuses the read.
      if (isAccessRevokedApiError(caught)) {
        setData(EMPTY_DATA);
      }
      setError(messageFromCaught(caught, t('errors.load')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, setError, load };
}

async function fetchDeliveryNorms(): Promise<DeliveryNormsPageData> {
  const [rates, profiles, prices, catalog, enrollment, salePrices, multiplier] = await Promise.all([
    deliveryNormsApi.listRoleRates(),
    deliveryNormsApi.listBaseProfiles(),
    deliveryNormsApi.listFunctionPrices(),
    deliveryFunctionsApi.listAll(),
    deliveryNormsApi.getEnrollment(),
    deliveryCatalogStructureApi.listSalePrices(),
    deliveryCatalogStructureApi.getDefaultMultiplier(),
  ]);
  return {
    rates,
    profiles,
    prices,
    catalog,
    enrollment,
    salePrices,
    defaultMultiplier: multiplier.defaultSaleMultiplier,
  };
}
