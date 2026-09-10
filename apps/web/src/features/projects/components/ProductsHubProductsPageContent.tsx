'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeroTabs,
  ViewModeSwitch,
  IntegratedSearchFilters,
  DetailSheetTabPanel,
  useModuleHeroSlots,
} from '@/components/shared';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { PRODUCT_HUB_TABS } from '@/features/projects/constants/projects';
import { PRODUCTS_HUB_SEARCH_PLACEHOLDER } from '@/features/projects/constants/projects-hub-page-constants';
import { PROJECT_HUB_DIRECTORY_VIEW_OPTIONS } from '@/features/projects/constants/projects-hub-view-options';
import type { ProductsHubViewMode } from '@/features/projects/constants/products-hub-page-preferences-storage';
import { ProductsHubDirectoryPanel } from '@/features/projects/components/projects-hub-directory-panels';
import { useProductsHubDirectory } from '@/features/projects/hooks/use-products-hub-directory';
import { productsHubEmptyCopy } from '@/features/projects/utils/products-hub-empty-copy';
import { buildProductDetailPageHref } from '@/features/projects/constants/product-detail-tab';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { Product } from '@/lib/api/products';

export function ProductsHubProductsPageContent() {
  const router = useRouter();
  const isMobileViewport = useIsMobileViewport();
  const directory = useProductsHubDirectory();
  const effectiveView: ProductsHubViewMode = isMobileViewport ? 'grid' : directory.viewMode;
  const emptyCopy = productsHubEmptyCopy(directory.activeTab);

  useModuleHeroSlots(
    useProductsHubHeroSlots({
      activeTab: directory.activeTab,
      setActiveTab: directory.setActiveTab,
      searchInput: directory.searchInput,
      setSearchInput: directory.setSearchInput,
      viewMode: directory.viewMode,
      setViewMode: directory.setViewMode,
      isMobileViewport,
    }),
  );

  return (
    <>
      <DetailSheetTabPanel tabKey={directory.activeTab}>
        <ProductsHubDirectoryPanel
          loading={directory.loading}
          error={directory.error}
          products={directory.items}
          view={effectiveView}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          onRetry={() => void directory.refetch()}
          onProductClick={(product: Product) =>
            router.push(buildProductDetailPageHref(product.projectId, product.id))
          }
        />
      </DetailSheetTabPanel>
      {!directory.loading && !directory.error && directory.items.length > 0 ? (
        <>
          {directory.loadingMore ? (
            <p className="text-muted-foreground py-3 text-center text-xs">Loading more…</p>
          ) : null}
          <InfiniteScrollSentinel
            onReach={directory.loadMore}
            disabled={directory.loading || directory.loadingMore || !directory.hasMore}
          />
        </>
      ) : null}
    </>
  );
}

function useProductsHubHeroSlots({
  activeTab,
  setActiveTab,
  searchInput,
  setSearchInput,
  viewMode,
  setViewMode,
  isMobileViewport,
}: {
  activeTab: ReturnType<typeof useProductsHubDirectory>['activeTab'];
  setActiveTab: ReturnType<typeof useProductsHubDirectory>['setActiveTab'];
  searchInput: string;
  setSearchInput: (value: string) => void;
  viewMode: ProductsHubViewMode;
  setViewMode: ReturnType<typeof useProductsHubDirectory>['setViewMode'];
  isMobileViewport: boolean;
}) {
  return useMemo(
    () => ({
      tabs: (
        <PageHeroTabs
          value={activeTab}
          onChange={setActiveTab}
          options={[...PRODUCT_HUB_TABS]}
          ariaLabel="Product Hub filters"
          showOnMobile
          registerMobileDock={false}
        />
      ),
      search: (
        <IntegratedSearchFilters
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={PRODUCTS_HUB_SEARCH_PLACEHOLDER}
          onClearAll={() => setSearchInput('')}
        />
      ),
      viewMode: isMobileViewport ? null : (
        <ViewModeSwitch
          value={viewMode}
          onChange={setViewMode}
          options={PROJECT_HUB_DIRECTORY_VIEW_OPTIONS}
        />
      ),
    }),
    [activeTab, isMobileViewport, searchInput, setActiveTab, setSearchInput, setViewMode, viewMode],
  );
}
