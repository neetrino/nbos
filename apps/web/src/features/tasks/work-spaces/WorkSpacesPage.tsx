'use client';

import { useCallback, useMemo, useState } from 'react';
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
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
  type ViewModeOption,
} from '@/components/shared';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import type { FullProduct } from '@/lib/api/products';
import { CreateStandaloneWorkSpaceDialog } from './CreateStandaloneWorkSpaceDialog';
import { WorkSpacesSettingsSheet } from './WorkSpacesSettingsSheet';
import { WorkSpaceCard } from './WorkSpaceCard';
import { WorkSpaceListTable } from './WorkSpaceListTable';
import {
  loadWorkSpaceProductForSheets,
  WorkSpacesEntitySheetsHost,
} from './WorkSpacesEntitySheetsHost';
import { useWorkSpacesDirectory } from './use-work-spaces-directory';

type WorkSpaceView = 'grid' | 'list';

const WORKSPACE_VIEW_OPTIONS: ViewModeOption<WorkSpaceView>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card grid view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

export function WorkSpacesPage() {
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

  const handleOpenProductDelivery = useCallback(
    async (productId: string) => {
      try {
        const loaded = await loadWorkSpaceProductForSheets(productId);
        setSheetProduct(loaded);
        openDeliveryItem(`product-${productId}`);
      } catch {
        toast.error('Product could not be loaded.');
      }
    },
    [openDeliveryItem],
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
        label: 'Mode',
        options: [
          { value: 'scrum', label: 'Scrum' },
          { value: 'kanban', label: 'Kanban' },
        ],
      },
    ];
  }, []);

  const tabOptions = useMemo(
    () => [
      {
        value: 'standalone' as const,
        label: `Standalone (${counts.standalone})`,
        icon: FolderKanban,
      },
      { value: 'product' as const, label: `Product (${counts.product})`, icon: Package },
    ],
    [counts.product, counts.standalone],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Work Spaces"
        tabs={
          <PageHeroTabs
            value={tab}
            onChange={setTab}
            options={tabOptions}
            ariaLabel="Work space type"
          />
        }
        search={
          <IntegratedSearchFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by name, project, product…"
            filters={workSpaceFilterConfigs}
            filterValues={{ mode }}
            onFilterChange={(key, value) => {
              if (key === 'mode') {
                setMode(value as 'all' | 'scrum' | 'kanban');
              }
            }}
            onClearAll={() => {
              setMode('all');
              setSearchInput('');
            }}
          />
        }
        viewMode={
          <ViewModeSwitch value={view} onChange={setView} options={WORKSPACE_VIEW_OPTIONS} />
        }
        trailing={
          <>
            <WorkSpacesSettingsSheet items={items} />
            {tab === 'standalone' ? (
              <Button
                type="button"
                className="shrink-0 gap-2"
                aria-label="Create new work space"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                Space
              </Button>
            ) : null}
          </>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Work Spaces found"
          description={
            tab === 'standalone'
              ? 'Try another search or create a standalone space for internal planning.'
              : 'Product delivery spaces appear when a product has an ensured work space. Open a product from Projects to connect tasks.'
          }
          action={
            tab === 'standalone' ? (
              <Button
                type="button"
                aria-label="Create new work space"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                Space
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {items.map((workspace) => (
            <WorkSpaceCard
              key={workspace.id}
              workspace={workspace}
              onOpenProductDelivery={handleOpenProductDelivery}
              onOpenProductDeal={handleOpenProductDeal}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card/40 overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]">
          <WorkSpaceListTable workspaces={items} />
        </div>
      )}

      {!loading && !error && items.length > 0 ? (
        <WorkSpacesPaginationFooter meta={meta} onPageChange={setPage} />
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

function WorkSpacesPaginationFooter({
  meta,
  onPageChange,
}: {
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  onPageChange: (page: number) => void;
}) {
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="text-muted-foreground flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        {start}–{end} of {meta.total}
      </span>
      {meta.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground px-1 tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
