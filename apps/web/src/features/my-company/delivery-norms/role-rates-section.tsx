'use client';

import type { DeliveryRoleRateFinancialDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { RoleRateCreateForm } from './role-rate-create-form';
import { RoleRatesTable } from './role-rates-table';

export function RoleRatesSection({
  rows,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  rows: DeliveryRoleRateFinancialDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsSectionCard title={t('rates.title')} description={t('rates.subtitle')}>
      {canAdd ? (
        <RoleRateCreateForm disabled={false} onCreated={onChanged} onError={onError} />
      ) : null}
      <RoleRatesTable
        rows={rows}
        canPublish={canPublish}
        onPublished={onChanged}
        onError={onError}
      />
    </DeliveryNormsSectionCard>
  );
}
