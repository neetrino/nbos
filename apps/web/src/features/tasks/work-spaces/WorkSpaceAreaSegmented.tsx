'use client';

import { useTranslations } from 'next-intl';
import { PageHeroTabs } from '@/components/shared';
import type { WorkspaceArea } from './workspace-area';

export function WorkSpaceAreaSegmented({
  value,
  onValueChange,
  className,
}: {
  value: WorkspaceArea;
  onValueChange: (area: WorkspaceArea) => void;
  className?: string;
}) {
  const t = useTranslations('workSpaces');
  return (
    <PageHeroTabs
      value={value}
      onChange={onValueChange}
      options={[
        { value: 'active' as const, label: t('area.active') },
        { value: 'planning' as const, label: t('area.planning') },
      ]}
      ariaLabel={t('areaAria')}
      className={className}
      showOnMobile
      registerMobileDock={false}
    />
  );
}
