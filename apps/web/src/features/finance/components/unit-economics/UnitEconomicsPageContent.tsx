'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PieChart } from 'lucide-react';
import {
  EmptyState,
  IntegratedSearchFilters,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { ProductBonusPoolSheet } from '@/features/finance/components/bonus/product-bonus-pool-sheet';
import { buildUnitEconomicsFilterConfigs } from '@/features/finance/components/unit-economics/build-unit-economics-filter-configs';
import { computeUnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
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
import { UnitEconomicsSummaryStrip } from '@/features/finance/components/unit-economics/unit-economics-summary-strip';
import { UNIT_ECONOMICS_VIEW_OPTIONS } from '@/features/finance/components/unit-economics/unit-economics-view-options';
import { unitEconomicsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  parseUnitEconomicsDrilldownFocus,
  UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY,
  UNIT_ECONOMICS_OPEN_ORDER_QUERY,
} from '@/features/finance/constants/unit-economics-drilldown-url';
import { useUnitEconomicsBoardViewMode } from '@/features/finance/constants/unit-economics-board-view';
import { useUnitEconomicsPoolSheet } from '@/features/finance/hooks/use-unit-economics-pool-sheet';
import { useUnitEconomicsList } from '@/features/finance/hooks/use-unit-economics-list';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { buildUnitEconomicsOrderDetailPlaceholder } from '@/features/finance/utils/unit-economics-order-detail-placeholder';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

/** Operational finance per delivery unit — money in, money out, balance. */
export function UnitEconomicsPageContent() {
  useFinanceDocumentTitle(unitEconomicsPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { items, projects, products, totals, loading, error, reload } = useUnitEconomicsList();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UnitEconomicsFilterValues>(UE_FILTER_DEFAULTS);
  const [view, handleViewChange] = useUnitEconomicsBoardViewMode();

  const [drilldownOrderId, setDrilldownOrderId] = useState<string | null>(null);
  const [drilldownFocus, setDrilldownFocus] = useState<UnitEconomicsDrilldownFocus>('invoices');
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  const poolSheet = useUnitEconomicsPoolSheet();

  const replaceUnitEconomicsUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const onDrilldown = useCallback(
    (orderId: string, focus: UnitEconomicsDrilldownFocus) => {
      setDrilldownOrderId(orderId);
      setDrilldownFocus(focus);
      setDrilldownOpen(true);
      replaceUnitEconomicsUrl((params) => {
        params.set(UNIT_ECONOMICS_OPEN_ORDER_QUERY, orderId);
        params.set(UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY, focus);
      });
    },
    [replaceUnitEconomicsUrl],
  );

  const handleDrilldownOpenChange = useCallback(
    (next: boolean) => {
      setDrilldownOpen(next);
      if (!next) {
        replaceUnitEconomicsUrl((params) => {
          params.delete(UNIT_ECONOMICS_OPEN_ORDER_QUERY);
          params.delete(UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY);
        });
      }
    },
    [replaceUnitEconomicsUrl],
  );

  const handleDrilldownFocusChange = useCallback(
    (focus: UnitEconomicsDrilldownFocus) => {
      setDrilldownFocus(focus);
      if (!drilldownOrderId) return;
      replaceUnitEconomicsUrl((params) => {
        params.set(UNIT_ECONOMICS_OPEN_ORDER_QUERY, drilldownOrderId);
        params.set(UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY, focus);
      });
    },
    [drilldownOrderId, replaceUnitEconomicsUrl],
  );

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
  const filteredTotals = useMemo(
    () => computeUnitEconomicsFilteredTotals(filteredItems),
    [filteredItems],
  );

  const initialDrilldownDetail = useMemo(() => {
    if (!drilldownOrderId) return null;
    const row = filteredItems.find((item) => item.orderId === drilldownOrderId);
    return row ? buildUnitEconomicsOrderDetailPlaceholder(row) : null;
  }, [drilldownOrderId, filteredItems]);

  const boardData: UnitEconomicsBoardData = useMemo(
    () => ({
      items: filteredItems,
      projects: filteredProjects,
      products: filteredProducts,
      totals,
      filteredTotals,
      loading,
      error,
      reload,
    }),
    [
      filteredItems,
      filteredProjects,
      filteredProducts,
      totals,
      filteredTotals,
      loading,
      error,
      reload,
    ],
  );

  const drilldownUrlKey = `${searchParams.toString()}:${loading}:${items.length}`;
  const [handledDrilldownUrlKey, setHandledDrilldownUrlKey] = useState<string | null>(null);

  if (!loading && handledDrilldownUrlKey !== drilldownUrlKey) {
    const orderId = searchParams.get(UNIT_ECONOMICS_OPEN_ORDER_QUERY)?.trim();
    const exists = Boolean(orderId && items.some((row) => row.orderId === orderId));
    setHandledDrilldownUrlKey(drilldownUrlKey);
    if (exists && orderId) {
      setDrilldownOrderId(orderId);
      setDrilldownFocus(
        parseUnitEconomicsDrilldownFocus(searchParams.get(UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY)),
      );
      setDrilldownOpen(true);
    }
  }

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
    (view === 'tree' || view === 'orders' || view === 'cards');

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 pb-5">
      {!showFilteredEmpty && filteredItems.length > 0 ? (
        <UnitEconomicsSummaryStrip totals={filteredTotals} />
      ) : null}

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
            activeOrderId={drilldownOpen ? drilldownOrderId : null}
            onDrilldown={onDrilldown}
          />
        )}
      </div>

      <UnitEconomicsDrilldownSheet
        orderId={drilldownOrderId}
        focus={drilldownFocus}
        open={drilldownOpen}
        onOpenChange={handleDrilldownOpenChange}
        onFocusChange={handleDrilldownFocusChange}
        onOpenPoolDetail={onOpenPoolDetail}
        initialOrderDetail={initialDrilldownDetail}
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
