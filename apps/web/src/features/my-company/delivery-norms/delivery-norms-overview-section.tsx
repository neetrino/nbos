'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';
import { DeliveryNormsModelMap } from './delivery-norms-model-map';
import { DeliveryNormsPanelHeader } from './delivery-norms-panel-header';
import { OVERVIEW_COUNT_CARD_CLASS } from './delivery-norms.constants';
import { countPublished, type DeliveryNormsMapKey } from './delivery-norms-workspace';
import { EnrollmentSwitchSection } from './enrollment-switch-section';

export function DeliveryNormsOverviewSection({
  data,
  canToggle,
  onChanged,
  onError,
  onOpen,
}: {
  data: DeliveryNormsPageData;
  canToggle: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  onOpen: (key: DeliveryNormsMapKey) => void;
}) {
  const t = useTranslations('hr.deliveryNorms.workspace');
  return (
    <div className="space-y-5">
      <DeliveryNormsPanelHeader
        index={t('overview.index')}
        title={t('overview.title')}
        description={t('overview.lead')}
      />
      <EnrollmentSwitchSection
        setting={data.enrollment}
        canToggle={canToggle}
        onChanged={onChanged}
        onError={onError}
      />
      <OverviewCounts data={data} onOpen={onOpen} />
      <DeliveryNormsModelMap onOpen={onOpen} />
    </div>
  );
}

function OverviewCounts({
  data,
  onOpen,
}: {
  data: DeliveryNormsPageData;
  onOpen: (key: DeliveryNormsMapKey) => void;
}) {
  const t = useTranslations('hr.deliveryNorms.workspace.overview.counts');
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <CountCard
        label={t('rates', { count: data.rates.length })}
        published={countPublished(data.rates)}
        onOpen={() => onOpen('rates')}
      />
      <CountCard
        label={t('profiles', { count: data.profiles.length })}
        published={countPublished(data.profiles)}
        onOpen={() => onOpen('unitCore')}
      />
      <CountCard
        label={t('functions', { count: data.prices.length })}
        published={countPublished(data.prices)}
        onOpen={() => onOpen('unitFunction')}
      />
      <CountCard
        label={t('sale', { count: data.salePrices.length })}
        published={countPublished(data.salePrices)}
        onOpen={() => onOpen('sale')}
      />
    </div>
  );
}

function CountCard({
  label,
  published,
  onOpen,
}: {
  label: string;
  published: number;
  onOpen: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms.workspace.overview.counts');
  return (
    <button type="button" onClick={onOpen} className={OVERVIEW_COUNT_CARD_CLASS}>
      <p className="text-foreground text-sm font-medium">{label}</p>
      <StatusBadge label={t('published', { published })} variant="emerald" />
    </button>
  );
}
