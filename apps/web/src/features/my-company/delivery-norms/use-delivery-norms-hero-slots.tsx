'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Coins, Layers, ListTree, Package, Tag } from 'lucide-react';
import { PageHeroTabs, type PageHeroTabOption, useModuleHeroSlots } from '@/components/shared';
import type { DeliveryNormsTab } from './delivery-norms-workspace';

export function useDeliveryNormsHeroSlots({
  tab,
  onTabChange,
}: {
  tab: DeliveryNormsTab;
  onTabChange: (tab: DeliveryNormsTab) => void;
}): void {
  const t = useTranslations('hr.deliveryNorms');
  const options = useMemo(
    (): PageHeroTabOption<DeliveryNormsTab>[] => [
      { value: 'overview', label: t('workspace.tabs.overview'), icon: ListTree },
      { value: 'rates', label: t('workspace.tabs.rates'), icon: Coins },
      { value: 'units', label: t('workspace.tabs.units'), icon: Layers },
      { value: 'profiles', label: t('workspace.tabs.profiles'), icon: Package },
      { value: 'sale', label: t('workspace.tabs.sale'), icon: Tag },
    ],
    [t],
  );

  const secondaryTabs = useMemo(
    () => (
      <PageHeroTabs
        value={tab}
        onChange={onTabChange}
        options={options}
        ariaLabel={t('workspace.tabs.aria')}
        showOnMobile
        registerMobileDock={false}
      />
    ),
    [onTabChange, options, t, tab],
  );

  const slots = useMemo(() => ({ secondaryTabs }), [secondaryTabs]);
  useModuleHeroSlots(slots);
}
