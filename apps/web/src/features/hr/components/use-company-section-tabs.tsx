'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeroTabs, useModuleHeroSlots } from '@/components/shared';
import {
  COMPANY_SECTION_TABS,
  companySectionFromPath,
  type CompanySectionGroup,
} from '@/features/hr/constants/my-company-section-tabs';

/** Second tab row under My Company, same pattern as Core & Function. */
export function useCompanySectionTabs(group: CompanySectionGroup, trailing?: ReactNode): void {
  const t = useTranslations('hr');
  const pathname = usePathname();
  const router = useRouter();
  const active = companySectionFromPath(pathname);
  const options = useMemo(
    () =>
      COMPANY_SECTION_TABS[group].map((tab) => ({
        value: tab.href,
        label: t(tab.labelKey),
        icon: tab.icon,
      })),
    [group, t],
  );
  const secondaryTabs = useMemo(
    () => (
      <PageHeroTabs
        value={active}
        onChange={(href) => router.push(href)}
        options={options}
        ariaLabel={t('companyNav.subtabsAria')}
        showOnMobile
        registerMobileDock={false}
      />
    ),
    [active, options, router, t],
  );
  const slots = useMemo(() => ({ secondaryTabs, trailing }), [secondaryTabs, trailing]);
  useModuleHeroSlots(slots);
}
