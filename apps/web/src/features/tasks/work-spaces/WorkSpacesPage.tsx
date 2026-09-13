'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FolderKanban, LayoutGrid, List, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  type FilterConfig,
  LoadingState,
  ListPagination,
  NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS,
  WORK_SPACE_PRODUCT_CARD_GRID_CLASS,
  WorkSpaceNavigableCard,
  type ViewModeOption,
} from '@/components/shared';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import type { FullProduct } from '@/lib/api/products';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { CreateStandaloneWorkSpaceDialog } from './CreateStandaloneWorkSpaceDialog';
import { WorkSpacesSettingsSheet } from './WorkSpacesSettingsSheet';
import { WorkSpaceListTable } from './WorkSpaceListTable';
import {
  loadWorkSpaceProductForSheets,
  WorkSpacesEntitySheetsHost,
} from './WorkSpacesEntitySheetsHost';
import { useWorkSpacesDirectory } from './use-work-spaces-directory';
import { WorkSpacesDirectoryHeaderNav } from './WorkSpacesDirectoryHeaderNav';

type WorkSpaceView = 'grid' | 'list';

export function WorkSpacesPage() {
  const t = useTranslations('workSpaces');
  const [createOpen, setCreateOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState<FullProduct | null>(null);
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const directory = useWorkSpacesDirectory();
  const {
    tab,
    setTab,
    searchInput,
    setSearchInput,
    mode,
    setMode,
    setPage,
    view,
    setView,
    items,
    meta,
    counts,
    loading,
    error,
    refetch,
  } = directory;
  const isMobileViewport = useIsMobileViewport();
  const showDesktopDirectoryChrome = !isMobileViewport;
  const directoryView = isMobileViewport ? 'grid' : view;

  const handleOpenProductDelivery = useCallback(
    async (productId: string) => {
      try {
        const loaded = await loadWorkSpaceProductForSheets(productId);
        setSheetProduct(loaded);
        openDeliveryItem(`product-${productId}`);
      } catch {
        toast.error(t('productLoadFailed'));
      }
    },
    [openDeliveryItem, t],
  );

  const handleOpenProductDeal = useCallback(
    (dealId: string) => {
      openDeal(dealId);
    },
    [openDeal],
  );

  const workSpaceFilterConfigs = useMemo((): FilterConfig[] => {
    return [
      {
        key: 'mode',
        label: t('filterMode'),
        options: [
          { value: 'scrum', label: t('mode.scrum') },
          { value: 'kanban', label: t('mode.kanban') },
        ],
      },
    ];
  }, [t]);

  const tabOptions = useMemo(
    () => [
      {
        value: 'standalone' as const,
        label: t('tabStandalone', { count: counts.standalone }),
        icon: FolderKanban,
      },
      {
        value: 'product' as const,
        label: t('tabProduct', { count: counts.product }),
        icon: Package,
      },
    ],
    [counts.product, counts.standalone, t],
  );

  const viewOptions = useMemo(
    (): ViewModeOption<WorkSpaceView>[] => [
      {
        value: 'grid',
        label: t('viewGrid'),
        icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
        ariaLabel: t('viewGridAria'),
      },
      {
        value: 'list',
        label: t('viewList'),
        icon: <List className="size-3.5 shrink-0" aria-hidden />,
        ariaLabel: t('viewListAria'),
      },
    ],
    [t],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <WorkSpacesDirectoryHeaderNav tab={tab} />
      <PageHero
        title={t('title')}
        tabs={
          <PageHeroTabs
            value={tab}
            onChange={setTab}
            options={tabOptions}
            ariaLabel={t('typeAria')}
            registerMobileDock={false}
          />
        }
        search={
          <IntegratedSearchFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder={t('searchPlaceholder')}
            filters={showDesktopDirectoryChrome ? workSpaceFilterConfigs : undefined}
            filterValues={showDesktopDirectoryChrome ? { mode } : undefined}
            onFilterChange={
              showDesktopDirectoryChrome
                ? (key, value) => {
                    if (key === 'mode') {
                      setMode(value as 'all' | 'scrum' | 'kanban');
                    }
                  }
                : undefined
            }
            onClearAll={
              showDesktopDirectoryChrome
                ? () => {
                    setMode('all');
                    setSearchInput('');
                  }
                : undefined
            }
          />
        }
        viewMode={
          showDesktopDirectoryChrome ? (
            <ViewModeSwitch value={view} onChange={setView} options={viewOptions} />
          ) : null
        }
        trailing={
          <>
            <WorkSpacesSettingsSheet items={items} />
            {tab === 'standalone' ? (
              <Button
                type="button"
                className="shrink-0 gap-2"
                aria-label={t('createAria')}
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                {t('createShort')}
              </Button>
            ) : null}
          </>
        }
      />

      {loading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={t('emptyTitle')}
          description={tab === 'standalone' ? t('emptyStandalone') : t('emptyProduct')}
          action={
            tab === 'standalone' ? (
              <Button
                type="button"
                aria-label={t('createAria')}
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                {t('createShort')}
              </Button>
            ) : undefined
          }
        />
      ) : directoryView === 'grid' ? (
        <div
          className={
            tab === 'product'
              ? WORK_SPACE_PRODUCT_CARD_GRID_CLASS
              : NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS
          }
        >
          {items.map((workspace) => (
            <WorkSpaceNavigableCard
              key={workspace.id}
              workspace={workspace}
              onOpenProductDelivery={handleOpenProductDelivery}
              onOpenProductDeal={handleOpenProductDeal}
            />
          ))}
        </div>
      ) : (
        <WorkSpaceListTable workspaces={items} />
      )}

      {!loading && !error && items.length > 0 ? (
        <ListPagination meta={meta} onPageChange={setPage} />
      ) : null}

      <CreateStandaloneWorkSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void refetch()}
      />

      <WorkSpacesEntitySheetsHost
        sheetProduct={sheetProduct}
        onSheetProductChange={setSheetProduct}
      />
    </div>
  );
}
