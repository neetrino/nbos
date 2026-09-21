'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeroTabs, type PageHeroTabOption } from '@/components/shared';
import type { DeliveryNormsPageData } from './use-delivery-norms-page-data';
import { BaseProfilesSection } from './base-profiles-section';
import { CoreItemsSection } from './core-items-section';
import { DeliveryNormsPanelHeader } from './delivery-norms-panel-header';
import { type DeliveryNormsProfileTab } from './delivery-norms-workspace';
import { FunctionCollectionsSection } from './function-collections-section';

export function DeliveryNormsProfileWorkspace({
  data,
  profileTab,
  canAdd,
  canPublish,
  onProfileTabChange,
  onChanged,
  onError,
}: {
  data: DeliveryNormsPageData;
  profileTab: DeliveryNormsProfileTab;
  canAdd: boolean;
  canPublish: boolean;
  onProfileTabChange: (tab: DeliveryNormsProfileTab) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const options = useMemo(
    (): PageHeroTabOption<DeliveryNormsProfileTab>[] => [
      { value: 'versions', label: t('workspace.profileTabs.versions') },
      { value: 'core', label: t('workspace.profileTabs.core') },
      { value: 'collections', label: t('workspace.profileTabs.collections') },
    ],
    [t],
  );

  const copy = profilePanelCopy(profileTab, t);

  return (
    <div className="space-y-5">
      <DeliveryNormsPanelHeader
        index={t('workspace.map.profiles.index')}
        title={copy.title}
        description={copy.description}
      />
      <PageHeroTabs
        value={profileTab}
        onChange={onProfileTabChange}
        options={options}
        ariaLabel={t('workspace.profileTabs.aria')}
        showOnMobile
        registerMobileDock={false}
      />
      <ProfileTabPanel
        data={data}
        profileTab={profileTab}
        canAdd={canAdd}
        canPublish={canPublish}
        onChanged={onChanged}
        onError={onError}
      />
    </div>
  );
}

function ProfileTabPanel({
  data,
  profileTab,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  data: DeliveryNormsPageData;
  profileTab: DeliveryNormsProfileTab;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (profileTab === 'core') {
    return (
      <CoreItemsSection rows={data.profiles} canEdit={canPublish} onError={onError} embedded />
    );
  }
  if (profileTab === 'collections') {
    return (
      <FunctionCollectionsSection
        rows={data.profiles}
        catalog={data.catalog}
        canEdit={canPublish}
        onError={onError}
        embedded
      />
    );
  }
  return (
    <BaseProfilesSection
      rows={data.profiles}
      catalog={data.catalog}
      canAdd={canAdd}
      canPublish={canPublish}
      onChanged={onChanged}
      onError={onError}
      embedded
    />
  );
}

function profilePanelCopy(
  tab: DeliveryNormsProfileTab,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): { title: string; description: string } {
  if (tab === 'core') {
    return { title: t('coreItems.title'), description: t('coreItems.subtitle') };
  }
  if (tab === 'collections') {
    return { title: t('collections.title'), description: t('collections.subtitle') };
  }
  return { title: t('profiles.title'), description: t('profiles.subtitle') };
}
