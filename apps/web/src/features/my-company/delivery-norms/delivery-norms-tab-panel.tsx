'use client';

import { useTranslations } from 'next-intl';
import { DeliveryNormsOverviewSection } from './delivery-norms-overview-section';
import { DeliveryNormsPanelHeader } from './delivery-norms-panel-header';
import { DeliveryNormsProfileWorkspace } from './delivery-norms-profile-workspace';
import type {
  DeliveryNormsMapKey,
  DeliveryNormsProfileTab,
  DeliveryNormsTab,
} from './delivery-norms-workspace';
import { FunctionPricesSection } from './function-prices-section';
import { RoleRatesSection } from './role-rates-section';
import { SalePricesSection } from './sale-prices-section';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';

type DeliveryNormsTabPanelProps = {
  tab: DeliveryNormsTab;
  profileTab: DeliveryNormsProfileTab;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  onProfileTabChange: (tab: DeliveryNormsProfileTab) => void;
  onOpen: (key: DeliveryNormsMapKey) => void;
};

export function DeliveryNormsTabPanel({
  tab,
  profileTab,
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
  onProfileTabChange,
  onOpen,
}: DeliveryNormsTabPanelProps) {
  if (tab === 'overview') {
    return (
      <DeliveryNormsOverviewSection
        data={data}
        canToggle={canPublish}
        onChanged={onChanged}
        onError={onError}
        onOpen={onOpen}
      />
    );
  }
  if (tab === 'profiles') {
    return (
      <DeliveryNormsProfileWorkspace
        data={data}
        profileTab={profileTab}
        canAdd={canAdd}
        canPublish={canPublish}
        onProfileTabChange={onProfileTabChange}
        onChanged={onChanged}
        onError={onError}
      />
    );
  }
  return (
    <DomainEditor
      tab={tab}
      data={data}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={onChanged}
      onError={onError}
    />
  );
}

const DOMAIN_COPY = {
  rates: {
    index: 'workspace.map.rates.index',
    title: 'rates.title',
    subtitle: 'rates.subtitle',
  },
  functions: {
    index: 'workspace.map.functions.index',
    title: 'prices.title',
    subtitle: 'prices.subtitle',
  },
  sale: {
    index: 'workspace.map.sale.index',
    title: 'salePrices.title',
    subtitle: 'salePrices.subtitle',
  },
} as const;

function DomainEditor({
  tab,
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  tab: Exclude<DeliveryNormsTab, 'overview' | 'profiles'>;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const copy = DOMAIN_COPY[tab];
  return (
    <div className="space-y-5">
      <DeliveryNormsPanelHeader
        index={t(copy.index)}
        title={t(copy.title)}
        description={t(copy.subtitle)}
      />
      <DomainEditorBody
        tab={tab}
        data={data}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
    </div>
  );
}

function DomainEditorBody({
  tab,
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  tab: Exclude<DeliveryNormsTab, 'overview' | 'profiles'>;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (tab === 'rates') {
    return (
      <RoleRatesSection
        rows={data.rates}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
        embedded
      />
    );
  }
  if (tab === 'functions') {
    return (
      <FunctionPricesSection
        rows={data.prices}
        catalog={data.catalog}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
        embedded
      />
    );
  }
  return (
    <SalePricesSection
      rows={data.salePrices}
      catalog={data.catalog}
      profiles={data.profiles}
      canEdit={canPublish}
      onChanged={onChanged}
      onError={onError}
      embedded
    />
  );
}
