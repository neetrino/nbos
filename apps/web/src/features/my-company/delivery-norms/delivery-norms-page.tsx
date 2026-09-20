'use client';

import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import {
  DataView,
  ErrorState,
  ListMutationErrorBanner,
  LoadingState,
  PageHero,
} from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { BaseProfilesSection } from './base-profiles-section';
import { EnrollmentSwitchSection } from './enrollment-switch-section';
import { LOADING_CARD_COUNT } from './delivery-norms.constants';
import { FunctionPricesSection } from './function-prices-section';
import { RoleRatesSection } from './role-rates-section';
import { useDeliveryNormsPageData } from './use-delivery-norms-page-data';

export function DeliveryNormsPage() {
  const t = useTranslations('hr.deliveryNorms');
  const { can } = usePermission();
  const canAdd = can('ADD', DELIVERY_COMPENSATION_RULES_MODULE);
  const canPublish = can('EDIT', DELIVERY_COMPENSATION_RULES_MODULE);
  const { data, loading, error, setError, load } = useDeliveryNormsPageData();
  const hasData =
    data.enrollment !== null ||
    data.rates.length > 0 ||
    data.profiles.length > 0 ||
    data.prices.length > 0;
  const content = (
    <DeliveryNormsSections
      data={data}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={() => void load()}
      onError={setError}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={t('title')}
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void load()}
          >
            {t('refresh')}
          </Button>
        }
      />
      <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      {error && hasData ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasData}
        loadingFallback={<LoadingState variant="cards" count={LOADING_CARD_COUNT} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={content}
      >
        {content}
      </DataView>
    </div>
  );
}

function DeliveryNormsSections({
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  data: ReturnType<typeof useDeliveryNormsPageData>['data'];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="space-y-6">
      <EnrollmentSwitchSection
        setting={data.enrollment}
        canToggle={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
      <RoleRatesSection
        rows={data.rates}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
      <BaseProfilesSection
        rows={data.profiles}
        catalog={data.catalog}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
      <FunctionPricesSection
        rows={data.prices}
        catalog={data.catalog}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
    </div>
  );
}
