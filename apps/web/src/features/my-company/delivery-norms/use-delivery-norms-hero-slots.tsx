'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Coins, Layers, ListTree, Puzzle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeroTabs, type PageHeroTabOption, useModuleHeroSlots } from '@/components/shared';
import type { DeliveryNormsTab } from './delivery-norms-workspace';

export function useDeliveryNormsHeroSlots({
  tab,
  loading,
  onTabChange,
  onRefresh,
}: {
  tab: DeliveryNormsTab;
  loading: boolean;
  onTabChange: (tab: DeliveryNormsTab) => void;
  onRefresh: () => void;
}): void {
  const t = useTranslations('hr.deliveryNorms');
  const options = useMemo(
    (): PageHeroTabOption<DeliveryNormsTab>[] => [
      { value: 'overview', label: t('workspace.tabs.overview'), icon: ListTree },
      { value: 'rates', label: t('workspace.tabs.rates'), icon: Coins },
      { value: 'profiles', label: t('workspace.tabs.profiles'), icon: Layers },
      { value: 'functions', label: t('workspace.tabs.functions'), icon: Puzzle },
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

  const trailing = useMemo(
    () => (
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRefresh}>
        {t('refresh')}
      </Button>
    ),
    [loading, onRefresh, t],
  );

  const slots = useMemo(() => ({ secondaryTabs, trailing }), [secondaryTabs, trailing]);
  useModuleHeroSlots(slots);
}
