'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import { deliveryFunctionsApi, type DeliveryRoleRateRow } from '@/lib/api/delivery-functions';
import { usePermission } from '@/lib/permissions';

export function DeliveryRatesPanel() {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canSeeRules = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const [rows, setRows] = useState<DeliveryRoleRateRow[]>([]);

  useEffect(() => {
    if (!canSeeRules) {
      return;
    }
    void deliveryFunctionsApi.listRoleRates().then(setRows);
  }, [canSeeRules]);

  if (!canSeeRules) {
    return null;
  }

  return (
    <section className="border-border bg-card space-y-3 rounded-2xl border p-4">
      <div>
        <h2 className="text-foreground text-base font-semibold">{t('ratesTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('ratesSubtitle')}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('normativeMissing')}</p>
      ) : (
        <ul className="text-foreground space-y-1 text-sm">
          {rows.map((row) => (
            <li key={row.id}>
              {row.roleKey}: {row.rate} {row.currency} ({row.status})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
