'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Coins, Layers, Library } from 'lucide-react';
import { PageHeroTabs, useModuleHeroSlots, type PageHeroTabOption } from '@/components/shared';
import type { DeliveryNormsSection } from './delivery-norms-workspace';

export function useDeliveryNormsSectionTabs({
  section,
  canSeeRules,
  onSectionChange,
}: {
  section: DeliveryNormsSection;
  canSeeRules: boolean;
  onSectionChange: (section: DeliveryNormsSection) => void;
}): ReactNode {
  const t = useTranslations('hr.deliveryNorms');
  const emptyHeroSlots = useMemo(() => ({}), []);
  useModuleHeroSlots(emptyHeroSlots);
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

  return useMemo(
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
}
