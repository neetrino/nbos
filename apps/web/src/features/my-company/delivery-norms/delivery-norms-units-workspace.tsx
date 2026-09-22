'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeroTabs, type PageHeroTabOption } from '@/components/shared';
import { CoreUnitsSection } from './core-units-section';
import { DeliveryNormsPanelHeader } from './delivery-norms-panel-header';
import { type DeliveryNormsUnitTab } from './delivery-norms-workspace';
import { FunctionPricesSection } from './function-prices-section';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';

export function DeliveryNormsUnitsWorkspace({
  data,
  unitTab,
  canAdd,
  canPublish,
  onUnitTabChange,
  onChanged,
  onError,
}: {
  data: DeliveryNormsPageData;
  unitTab: DeliveryNormsUnitTab;
  canAdd: boolean;
  canPublish: boolean;
  onUnitTabChange: (tab: DeliveryNormsUnitTab) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const options = useUnitTabOptions(t);
  const copy = unitPanelCopy(unitTab, t);
  return (
    <div className="space-y-5">
      <DeliveryNormsPanelHeader
        index={t('workspace.map.units.index')}
        title={copy.title}
        description={copy.description}
      />
      <PageHeroTabs
        value={unitTab}
        onChange={onUnitTabChange}
        options={options}
        ariaLabel={t('workspace.unitTabs.aria')}
        showOnMobile
        registerMobileDock={false}
      />
      <UnitTabBody
        tab={unitTab}
        data={data}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
    </div>
  );
}

function UnitTabBody({
  tab,
  data,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  tab: DeliveryNormsUnitTab;
  data: DeliveryNormsPageData;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (tab === 'function') {
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
    <CoreUnitsSection
      rows={data.profiles}
      catalog={data.catalog}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={onChanged}
      onError={onError}
    />
  );
}

function useUnitTabOptions(
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): PageHeroTabOption<DeliveryNormsUnitTab>[] {
  return useMemo(
    () => [
      { value: 'core', label: t('workspace.unitTabs.core') },
      { value: 'function', label: t('workspace.unitTabs.function') },
    ],
    [t],
  );
}

function unitPanelCopy(
  tab: DeliveryNormsUnitTab,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): { title: string; description: string } {
  if (tab === 'function') {
    return { title: t('prices.title'), description: t('prices.subtitle') };
  }
  return { title: t('cores.title'), description: t('cores.subtitle') };
}
