'use client';

import { useCallback, useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';
import {
  EmptyState,
  IntegratedSearchFilters,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { ProductBonusPoolSheet } from '@/features/finance/components/bonus/product-bonus-pool-sheet';
import { buildUnitEconomicsFilterConfigs } from '@/features/finance/components/unit-economics/build-unit-economics-filter-configs';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import {
  filterUnitEconomicsItems,
  filterUnitEconomicsProducts,
  filterUnitEconomicsProjects,
  UE_FILTER_DEFAULTS,
  UE_FILTER_DELIVERY_KEY,
  UE_FILTER_ORDER_TYPE_KEY,
  UE_FILTER_PROJECT_KEY,
  type UnitEconomicsFilterValues,
  uniqueUnitEconomicsProjects,
} from '@/features/finance/components/unit-economics/filter-unit-economics-data';
import { UnitEconomicsDrilldownSheet } from '@/features/finance/components/unit-economics/unit-economics-drilldown-sheet';
import { UnitEconomicsPagePanel } from '@/features/finance/components/unit-economics/unit-economics-page-panel';
import { UNIT_ECONOMICS_VIEW_OPTIONS } from '@/features/finance/components/unit-economics/unit-economics-view-options';
import { unitEconomicsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  readUnitEconomicsBoardViewMode,
  writeUnitEconomicsBoardViewMode,
  type UnitEconomicsBoardViewMode,
} from '@/features/finance/constants/unit-economics-board-view';
import { useUnitEconomicsPoolSheet } from '@/features/finance/hooks/use-unit-economics-pool-sheet';
import { useUnitEconomicsList } from '@/features/finance/hooks/use-unit-economics-list';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

/** Operational finance per delivery unit — money in, money out, balance. */
export function UnitEconomicsPageContent() {
  useFinanceDocumentTitle(unitEconomicsPageTitle());

  const { items, projects, products, totals, loading, error, reload } = useUnitEconomicsList();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UnitEconomicsFilterValues>(UE_FILTER_DEFAULTS);
  const [view, setView] = useState<UnitEconomicsBoardViewMode>(() =>
    readUnitEconomicsBoardViewMode(),
  );

  const [drilldownOrderId, setDrilldownOrderId] = useState<string | null>(null);
  const [drilldownFocus, setDrilldownFocus] = useState<UnitEconomicsDrilldownFocus>('invoices');
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  const poolSheet = useUnitEconomicsPoolSheet();

  const handleViewChange = useCallback((mode: UnitEconomicsBoardViewMode) => {
    setView(mode);
    writeUnitEconomicsBoardViewMode(mode);
  }, []);

  const onDrilldown = useCallback((orderId: string, focus: UnitEconomicsDrilldownFocus) => {
    setDrilldownOrderId(orderId);
    setDrilldownFocus(focus);
    setDrilldownOpen(true);
  }, []);

  const onOpenPoolDetail = useCallback(
    (orderId: string) => {
      void poolSheet.openForOrder(orderId);
    },
    [poolSheet],
  );

  const projectOptions = useMemo(() => uniqueUnitEconomicsProjects(items), [items]);
  const filterConfigs = useMemo(
    () => buildUnitEconomicsFilterConfigs(projectOptions),
    [projectOptions],
  );

  const filteredItems = useMemo(
    () => filterUnitEconomicsItems(items, search, filters),
    [items, search, filters],
  );
  const filteredProjects = useMemo(
    () => filterUnitEconomicsProjects(projects, search, filters),
    [projects, search, filters],
  );
  const filteredProducts = useMemo(
    () => filterUnitEconomicsProducts(products, search, filters),
    [products, search, filters],
  );

  const boardData: UnitEconomicsBoardData = useMemo(
    () => ({
      items: filteredItems,
      projects: filteredProjects,
      products: filteredProducts,
      totals,
      loading,
      error,
      reload,
    }),
    [filteredItems, filteredProjects, filteredProducts, totals, loading, error, reload],
  );

  const filterValues = useMemo(
    () => ({
      [UE_FILTER_PROJECT_KEY]: filters.project,
      [UE_FILTER_ORDER_TYPE_KEY]: filters.orderType,
      [UE_FILTER_DELIVERY_KEY]: filters.delivery,
    }),
    [filters],
  );

  const handleFilterChange = useCallback((key: string, value: string) => {
    if (key === UE_FILTER_PROJECT_KEY) {
      setFilters((prev) => ({ ...prev, project: value === 'all' ? 'all' : value }));
      return;
    }
    if (key === UE_FILTER_ORDER_TYPE_KEY) {
      setFilters((prev) => ({ ...prev, orderType: value === 'all' ? 'all' : value }));
      return;
    }
    if (key === UE_FILTER_DELIVERY_KEY) {
      setFilters((prev) => ({ ...prev, delivery: value === 'all' ? 'all' : value }));
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilters(UE_FILTER_DEFAULTS);
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by unit, order, project, product…"
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={UNIT_ECONOMICS_VIEW_OPTIONS}
          ariaLabel="Unit economics view"
        />
      ),
    }),
    [
      filterConfigs,
      filterValues,
      handleClearFilters,
      handleFilterChange,
      handleViewChange,
      search,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const showFilteredEmpty =
    !loading &&
    !error &&
    items.length > 0 &&
    filteredItems.length === 0 &&
    (view === 'list' || view === 'cards');

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        {showFilteredEmpty ? (
          <EmptyState
            icon={PieChart}
            title="No matching delivery units"
            description="Adjust search or filters to see units in this view."
            action={null}
          />
        ) : (
          <UnitEconomicsPagePanel
            view={view}
            data={boardData}
            filteredItems={filteredItems}
            onDrilldown={onDrilldown}
          />
        )}
      </div>

      <UnitEconomicsDrilldownSheet
        orderId={drilldownOrderId}
        focus={drilldownFocus}
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        onOpenPoolDetail={onOpenPoolDetail}
      />

      <ProductBonusPoolSheet
        pool={poolSheet.pool}
        open={poolSheet.open}
        onOpenChange={poolSheet.handleOpenChange}
        onPoolsRefresh={() => void poolSheet.refreshPools()}
      />
      {poolSheet.error && poolSheet.open && !poolSheet.pool ? (
        <p className="text-destructive text-sm">{poolSheet.error}</p>
      ) : null}
    </div>
  );
}
