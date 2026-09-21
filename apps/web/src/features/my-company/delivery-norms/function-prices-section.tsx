'use client';

import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { FunctionPriceCreateForm } from './function-price-create-form';
import { FunctionPricesList } from './function-prices-list';

export function FunctionPricesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: DeliveryFunctionPriceFinancialDto[];
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
      title={embedded ? undefined : t('prices.title')}
      description={embedded ? undefined : t('prices.subtitle')}
    >
      {canAdd ? (
        <FunctionPriceCreateForm catalog={catalog} onCreated={onChanged} onError={onError} />
      ) : null}
      <FunctionPricesList
        rows={rows}
        catalog={catalog}
        canPublish={canPublish}
        onPublished={onChanged}
        onError={onError}
      />
    </DeliveryNormsSectionCard>
  );
}
