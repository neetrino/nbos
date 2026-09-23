'use client';

import { useTranslations } from 'next-intl';
import { DeliveryNormsOverviewSection } from './delivery-norms-overview-section';
import { DeliveryNormsPanelHeader } from './delivery-norms-panel-header';
import { DeliveryNormsProfileWorkspace } from './delivery-norms-profile-workspace';
import { DeliveryNormsUnitsWorkspace } from './delivery-norms-units-workspace';
import type {
  DeliveryNormsMapKey,
  DeliveryNormsProfileTab,
  DeliveryNormsTab,
  DeliveryNormsUnitTab,
} from './delivery-norms-workspace';
import { RoleRatesSection } from './role-rates-section';
import { SalePricesSection } from './sale-prices-section';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';

type DeliveryNormsTabPanelProps = {
  tab: DeliveryNormsTab;
  profileTab: DeliveryNormsProfileTab;
  unitTab: DeliveryNormsUnitTab;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  onProfileTabChange: (tab: DeliveryNormsProfileTab) => void;
  onUnitTabChange: (tab: DeliveryNormsUnitTab) => void;
  onOpen: (key: DeliveryNormsMapKey) => void;
};

export function DeliveryNormsTabPanel({
  tab,
  profileTab,
  unitTab,
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
  onProfileTabChange,
  onUnitTabChange,
  onOpen,
}: DeliveryNormsTabPanelProps) {
  if (tab === 'overview' || tab === 'units' || tab === 'profiles') {
    return (
      <SpecialNormsTab
        tab={tab}
        profileTab={profileTab}
        unitTab={unitTab}
        data={data}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
        onProfileTabChange={onProfileTabChange}
        onUnitTabChange={onUnitTabChange}
        onOpen={onOpen}
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

function SpecialNormsTab(props: DeliveryNormsTabPanelProps) {
  if (props.tab === 'overview') {
    return (
      <DeliveryNormsOverviewSection
        data={props.data}
        canToggle={props.canPublish}
        onChanged={props.onChanged}
        onError={props.onError}
        onOpen={props.onOpen}
      />
    );
  }
  if (props.tab === 'units') {
    return (
      <DeliveryNormsUnitsWorkspace
        data={props.data}
        unitTab={props.unitTab}
        canAdd={props.canAdd}
        canPublish={props.canPublish}
        onUnitTabChange={props.onUnitTabChange}
        onChanged={props.onChanged}
        onError={props.onError}
      />
    );
  }
  return (
    <DeliveryNormsProfileWorkspace
      data={props.data}
      profileTab={props.profileTab}
      canPublish={props.canPublish}
      onProfileTabChange={props.onProfileTabChange}
      onChanged={props.onChanged}
      onError={props.onError}
    />
  );
}

const DOMAIN_COPY = {
  rates: {
    index: 'workspace.map.rates.index',
    title: 'rates.title',
    subtitle: 'rates.subtitle',
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
  tab: Exclude<DeliveryNormsTab, 'overview' | 'profiles' | 'units'>;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const body = (
    <DomainEditorBody
      tab={tab}
      data={data}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={onChanged}
      onError={onError}
    />
  );
  if (tab === 'sale') return body;
  const copy = DOMAIN_COPY[tab];
  return (
    <div className="space-y-5">
      <DeliveryNormsPanelHeader
        index={t(copy.index)}
        title={t(copy.title)}
        description={t(copy.subtitle)}
      />
      {body}
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
  tab: Exclude<DeliveryNormsTab, 'overview' | 'profiles' | 'units'>;
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
  return (
    <SalePricesSection
      rows={data.salePrices}
      prices={data.prices}
      catalog={data.catalog}
      profiles={data.profiles}
      canEdit={canPublish}
      onChanged={onChanged}
      onError={onError}
      embedded
    />
  );
}
