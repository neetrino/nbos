'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Coins, Layers, Library } from 'lucide-react';
import { PageHeroTabs, type PageHeroTabOption, useModuleHeroSlots } from '@/components/shared';
import type { DeliveryNormsSection } from './delivery-norms-workspace';

export function useDeliveryNormsHeroSlots({
  section,
  canSeeRules,
  onSectionChange,
}: {
  section: DeliveryNormsSection;
  canSeeRules: boolean;
  onSectionChange: (section: DeliveryNormsSection) => void;
}): void {
  const t = useTranslations('hr.deliveryNorms');
  const options = useMemo((): PageHeroTabOption<DeliveryNormsSection>[] => {
    const functionTab = {
      value: 'functions' as const,
      label: t('workspace.tabs.functions'),
      icon: Library,
    };
    if (!canSeeRules) return [functionTab];
    return [
      { value: 'core', label: t('workspace.tabs.core'), icon: Layers },
      functionTab,
      { value: 'rates', label: t('workspace.tabs.rates'), icon: Coins },
    ];
  }, [canSeeRules, t]);

  const secondaryTabs = useMemo(
    () => (
      <PageHeroTabs
        value={section}
        onChange={onSectionChange}
        options={options}
        ariaLabel={t('workspace.tabs.aria')}
        showOnMobile
        registerMobileDock={false}
      />
    ),
    [onSectionChange, options, section, t],
  );

  const slots = useMemo(() => ({ secondaryTabs }), [secondaryTabs]);
  useModuleHeroSlots(slots);
}
