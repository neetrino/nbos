'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { BonusPoolsBoardView } from '@/features/finance/components/bonus/bonus-pools-board-view';
import { BonusPoolsListView } from '@/features/finance/components/bonus/bonus-pools-list-view';
import { BONUS_POOLS_VIEW_OPTIONS } from '@/features/finance/components/bonus/bonus-pools-view-options';
import {
  buildBonusPoolsFilterConfigs,
  BONUS_POOLS_FILTER_KIND_KEY,
  BONUS_POOLS_FILTER_PROJECT_KEY,
  BONUS_POOLS_FILTER_STATUS_KEY,
} from '@/features/finance/components/bonus/build-bonus-pools-filter-configs';
import { useBonusProductPoolsCsvExport } from '@/features/finance/components/bonus/use-bonus-product-pools-csv-export';
import { ProductBonusPoolSheet } from '@/features/finance/components/bonus/product-bonus-pool-sheet';
import { BonusPoolsPageSettingsSheet } from '@/app/(app)/finance/bonus-pools/BonusPoolsPageSettingsSheet';
import { bonusProjectPoolsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  readBonusPoolsViewMode,
  writeBonusPoolsViewMode,
  type BonusPoolsViewMode,
} from '@/features/finance/constants/bonus-pools-view';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { computeBonusPoolsFilteredTotals } from '@/features/finance/utils/bonus-pools-filtered-totals';
import {
  filterBonusPoolsRows,
  uniqueBonusPoolProjects,
} from '@/features/finance/utils/bonus-pools-client-filter';
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi, type BonusProductPoolRow } from '@/lib/api/bonus';

const INITIAL_FILTERS = {
  [BONUS_POOLS_FILTER_PROJECT_KEY]: 'all',
  [BONUS_POOLS_FILTER_KIND_KEY]: 'all',
  [BONUS_POOLS_FILTER_STATUS_KEY]: 'all',
};

export function BonusPoolsPageContent(props: { documentTitle?: string }) {
  useFinanceDocumentTitle(props.documentTitle ?? bonusProjectPoolsPageTitle());

  const [rows, setRows] = useState<BonusProductPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState(INITIAL_FILTERS);
  const [view, setView] = useState<BonusPoolsViewMode>(() => readBonusPoolsViewMode());
  const [sheetPool, setSheetPool] = useState<BonusProductPoolRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bonusesApi.getProductPools();
      setRows(data);
      setSheetPool((current) =>
        current ? (data.find((row) => row.poolKey === current.poolKey) ?? current) : null,
      );
    } catch (caught) {
      setRows([]);
      setError(getApiErrorMessage(caught, 'Bonus pool roll-ups could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleViewChange = useCallback((mode: BonusPoolsViewMode) => {
    setView(mode);
    writeBonusPoolsViewMode(mode);
  }, []);

  const projectOptions = useMemo(() => uniqueBonusPoolProjects(rows), [rows]);

  const filterConfigs = useMemo(
    () => buildBonusPoolsFilterConfigs(projectOptions),
    [projectOptions],
  );

  const clientFilters = useMemo(
    () => ({
      search,
      projectId: filterValues[BONUS_POOLS_FILTER_PROJECT_KEY] ?? 'all',
      poolKind: filterValues[BONUS_POOLS_FILTER_KIND_KEY] ?? 'all',
      ledgerStatus: filterValues[BONUS_POOLS_FILTER_STATUS_KEY] ?? 'all',
    }),
    [filterValues, search],
  );

  const filteredRows = useMemo(
    () => filterBonusPoolsRows(rows, clientFilters),
    [clientFilters, rows],
  );

  const filteredTotals = useMemo(
    () => computeBonusPoolsFilteredTotals(filteredRows),
    [filteredRows],
  );

  const {
    exportCsvSubmitting,
    exportEmployeesSubmitting,
    handleExportCsv,
    handleExportEmployeesCsv,
  } = useBonusProductPoolsCsvExport(filteredRows);

  const openPoolSheet = useCallback((row: BonusProductPoolRow) => {
    setSheetPool(row);
    setSheetOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilterValues(INITIAL_FILTERS);
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search pools, projects, orders…"
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          onClearAll={handleClearFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={BONUS_POOLS_VIEW_OPTIONS}
        />
      ),
      trailing: (
        <BonusPoolsPageSettingsSheet
          exportDisabled={loading || Boolean(error) || filteredRows.length === 0}
          exportInProgress={exportCsvSubmitting}
          onExportCsv={handleExportCsv}
          exportEmployeesDisabled={loading || Boolean(error) || filteredRows.length === 0}
          exportEmployeesInProgress={exportEmployeesSubmitting}
          onExportEmployeesCsv={() => void handleExportEmployeesCsv()}
        />
      ),
    }),
    [
      error,
      exportCsvSubmitting,
      exportEmployeesSubmitting,
      filterConfigs,
      filterValues,
      filteredRows,
      handleClearFilters,
      handleExportCsv,
      handleExportEmployeesCsv,
      handleViewChange,
      loading,
      search,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const mainView = useMemo(() => {
    if (view === 'board') {
      return <BonusPoolsBoardView rows={filteredRows} onOpenPool={openPoolSheet} />;
    }
    return (
      <BonusPoolsListView rows={filteredRows} totals={filteredTotals} onOpenPool={openPoolSheet} />
    );
  }, [filteredRows, filteredTotals, openPoolSheet, view]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No bonus entries yet"
        description="Once bonus lines exist on orders, product-level roll-ups appear here."
        action={null}
      />
    );
  }

  if (filteredRows.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-6">
        <EmptyState
          icon={PieChart}
          title="No matching pools"
          description="Adjust search or filters to see product bonus pools."
          action={null}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {mainView}
      <ProductBonusPoolSheet
        pool={sheetPool}
        open={sheetOpen}
        onOpenChange={(next) => {
          setSheetOpen(next);
          if (!next) setSheetPool(null);
        }}
        onPoolsRefresh={load}
      />
    </div>
  );
}
