'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ExternalLink, Headphones, Wrench } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  PageHero,
  PageHeroTabs,
} from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { ProductTechnicalAssetsPanel } from '@/features/projects/components/product-tabs/product-technical-assets-panel';
import { ProductTechnicalEnvironmentsPanel } from '@/features/projects/components/product-tabs/product-technical-environments-panel';
import { ProductTechnicalHealthStrip } from '@/features/projects/components/product-tabs/product-technical-health-strip';
import { ProductTechnicalOpsPanel } from '@/features/projects/components/product-tabs/product-technical-ops-panel';
import { ProductTechnicalProfilePanel } from '@/features/projects/components/product-tabs/product-technical-profile-panel';
import {
  filterTechnicalListItems,
  technicalAssetItems,
  technicalEnvironmentItems,
} from '@/features/projects/components/product-tabs/product-technical-state';
import { PRODUCT_TECHNICAL_SECTION_OPTIONS } from '@/features/projects/constants/product-technical-section';
import type { UseProductTechnicalTabResult } from '@/features/projects/hooks/use-product-technical-tab';
import { cn } from '@/lib/utils';

type ProductTechnicalTabProps = UseProductTechnicalTabResult;

export function ProductTechnicalTab(props: ProductTechnicalTabProps) {
  const {
    data,
    loading,
    error,
    refetch,
    activeSection,
    setActiveSection,
    search,
    setSearch,
    profileDraft,
    setProfileDraft,
    assetDraft,
    setAssetDraft,
    envDraft,
    setEnvDraft,
    deployDraft,
    setDeployDraft,
    backupDraft,
    setBackupDraft,
    saveProfile,
    createAsset,
    createEnvironment,
    recordDeploy,
    saveBackupPolicy,
    saving,
  } = props;

  const assetItems = useMemo(
    () => (data ? filterTechnicalListItems(technicalAssetItems(data), search) : []),
    [data, search],
  );

  const environmentItems = useMemo(
    () => (data ? filterTechnicalListItems(technicalEnvironmentItems(data), search) : []),
    [data, search],
  );

  const showSearch = activeSection === 'assets' || activeSection === 'environments';

  if (loading && !data) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void refetch()} />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Wrench}
        title="Technical profile unavailable"
        description="Could not load the technical map for this product."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <ProductTechnicalHealthStrip data={data} />

      <PageHero
        title="Product technical"
        syncModuleTitle={false}
        className="mt-0"
        tabs={
          <PageHeroTabs
            value={activeSection}
            onChange={setActiveSection}
            options={PRODUCT_TECHNICAL_SECTION_OPTIONS}
            ariaLabel="Product technical section"
          />
        }
        search={
          showSearch ? (
            <IntegratedSearchFilters
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={
                activeSection === 'assets'
                  ? 'Search assets by name, type, provider…'
                  : 'Search environments by name, kind, URL…'
              }
              filters={[]}
              filterValues={{}}
              onFilterChange={() => undefined}
              onClearAll={() => setSearch('')}
            />
          ) : undefined
        }
        trailing={
          <Link
            href="/support"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <Headphones size={14} aria-hidden />
            Support
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        }
      />

      {activeSection === 'profile' ? (
        <ProductTechnicalProfilePanel
          data={data}
          draft={profileDraft}
          saving={saving}
          onDraftChange={setProfileDraft}
          onSave={saveProfile}
        />
      ) : activeSection === 'assets' ? (
        <ProductTechnicalAssetsPanel
          items={assetItems}
          search={search}
          assetDraft={assetDraft}
          saving={saving}
          onAssetDraftChange={setAssetDraft}
          onCreateAsset={createAsset}
        />
      ) : activeSection === 'environments' ? (
        <ProductTechnicalEnvironmentsPanel
          items={environmentItems}
          search={search}
          envDraft={envDraft}
          saving={saving}
          onEnvDraftChange={setEnvDraft}
          onCreateEnvironment={createEnvironment}
        />
      ) : (
        <ProductTechnicalOpsPanel
          deployDraft={deployDraft}
          backupDraft={backupDraft}
          lastDeployAt={data.profile.lastDeployAt}
          saving={saving}
          onDeployChange={setDeployDraft}
          onBackupChange={setBackupDraft}
          onRecordDeploy={recordDeploy}
          onSaveBackupPolicy={saveBackupPolicy}
        />
      )}
    </div>
  );
}
