'use client';

import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { BaseProfileCreateForm } from './base-profile-create-form';
import { BaseProfilesList } from './base-profiles-list';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';

export function BaseProfilesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsSectionCard title={t('profiles.title')} description={t('profiles.subtitle')}>
      {canAdd ? (
        <BaseProfileCreateForm catalog={catalog} onCreated={onChanged} onError={onError} />
      ) : null}
      <BaseProfilesList
        rows={rows}
        canPublish={canPublish}
        onPublished={onChanged}
        onError={onError}
      />
    </DeliveryNormsSectionCard>
  );
}
