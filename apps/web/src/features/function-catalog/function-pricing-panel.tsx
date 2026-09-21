'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import { deliveryFunctionsApi, type DeliveryFunctionPriceRow } from '@/lib/api/delivery-functions';
import { usePermission } from '@/lib/permissions';

export function FunctionPricingPanel({ functionId }: { functionId: string }) {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const [price, setPrice] = useState<DeliveryFunctionPriceRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canSeeRules) {
      return;
    }
    void deliveryFunctionsApi.listFunctionPrices().then((rows) => {
      const published =
        rows.find((row) => row.functionId === functionId && row.status === 'PUBLISHED') ?? null;
      setPrice(published);
      setLoaded(true);
    });
  }, [canSeeRules, functionId]);

  if (!canSeeRules) {
    return <p className="text-muted-foreground text-sm">{t('pricingHidden')}</p>;
  }
  if (!loaded) {
    return null;
  }
  if (!price) {
    return <p className="text-muted-foreground text-sm">{t('normativeMissing')}</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-foreground text-sm font-semibold">{t('pricing')}</h3>
      <ul className="text-foreground space-y-1 text-sm">
        {price.roleUnits.map((row) => (
          <li key={row.roleKey}>
            {row.roleKey}:{' '}
            {row.unitKind === 'NOT_REQUIRED' ? '—' : (row.units ?? t('normativeMissing'))}
          </li>
        ))}
      </ul>
    </div>
  );
}
