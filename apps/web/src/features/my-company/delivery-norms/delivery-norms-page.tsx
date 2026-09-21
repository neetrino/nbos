'use client';

import { useState } from 'react';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import { DataView, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { LOADING_CARD_COUNT } from './delivery-norms.constants';
import { DeliveryNormsTabPanel } from './delivery-norms-tab-panel';
import {
  DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID,
  locationForMapKey,
  type DeliveryNormsMapKey,
  type DeliveryNormsProfileTab,
  type DeliveryNormsTab,
} from './delivery-norms-workspace';
import { useDeliveryNormsHeroSlots } from './use-delivery-norms-hero-slots';
import {
  useDeliveryNormsPageData,
  type DeliveryNormsPageData,
} from './use-delivery-norms-page-data';

export function DeliveryNormsPage() {
  const { can } = usePermission();
  const canAdd = can('ADD', DELIVERY_COMPENSATION_RULES_MODULE);
  const canPublish = can('EDIT', DELIVERY_COMPENSATION_RULES_MODULE);
  const { data, loading, error, setError, load } = useDeliveryNormsPageData();
  const [tab, setTab] = useState<DeliveryNormsTab>('overview');
  const [profileTab, setProfileTab] = useState<DeliveryNormsProfileTab>('versions');
  useDeliveryNormsHeroSlots({
    tab,
    onTabChange: setTab,
  });
  const panel = (
    <DeliveryNormsTabPanel
      tab={tab}
      profileTab={profileTab}
      data={data}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={() => void load()}
      onError={setError}
      onProfileTabChange={setProfileTab}
      onOpen={(key) => openMapTarget(key, setTab, setProfileTab)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {error && hasDeliveryNormsData(data) ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasDeliveryNormsData(data)}
        loadingFallback={<LoadingState variant="cards" count={LOADING_CARD_COUNT} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={panel}
      >
        {panel}
      </DataView>
    </div>
  );
}

function openMapTarget(
  key: DeliveryNormsMapKey,
  setTab: (tab: DeliveryNormsTab) => void,
  setProfileTab: (tab: DeliveryNormsProfileTab) => void,
): void {
  const location = locationForMapKey(key);
  setTab(location.tab);
  setProfileTab(location.profileTab);
  if (location.tab !== 'overview') {
    return;
  }
  requestAnimationFrame(() => {
    document.getElementById(DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID)?.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  });
}

function hasDeliveryNormsData(data: DeliveryNormsPageData): boolean {
  return (
    data.enrollment !== null ||
    data.rates.length > 0 ||
    data.profiles.length > 0 ||
    data.prices.length > 0 ||
    data.salePrices.length > 0 ||
    data.defaultAmountPerUnit !== null
  );
}
