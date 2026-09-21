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
  embedded = false,
}: {
  rows: DeliveryBaseProfileFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('profiles.title')}
      description={embedded ? undefined : t('profiles.subtitle')}
    >
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
