'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gift, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { BonusBoardFilteredTotalsBar } from '@/features/finance/components/bonus/bonus-board-filtered-totals-bar';
import { computeBonusBoardFilteredTotals } from '@/features/finance/utils/bonus-board-filtered-totals';
import {
  readBonusBoardViewMode,
  writeBonusBoardViewMode,
  type BonusBoardViewMode,
} from '@/features/finance/constants/bonus-board-view';
import { BONUS_BOARD_VIEW_OPTIONS } from '@/features/finance/components/bonus/bonus-board-view-options';
import { BonusBoardListView } from '@/features/finance/components/bonus/bonus-board-list-view';
import {
  BonusBoardEmployeeView,
  BonusBoardPayrollMonthView,
  BonusBoardProductView,
} from '@/features/finance/components/bonus/bonus-board-grouped-view';
import {
  BONUS_BOARD_OPEN_ENTRY_QUERY,
  BONUS_BOARD_PROJECT_FILTER_QUERY,
} from '@/features/finance/constants/bonus-board-url';
import { CreateManualBonusDialog } from '@/features/finance/components/bonus/create-manual-bonus-dialog';
import { BonusEntryReleasesSheet } from '@/features/finance/components/bonus/bonus-entry-releases-sheet';
import { BonusBoardPageSettingsSheet } from '@/features/finance/components/bonus/BonusBoardPageSettingsSheet';
import {
  buildBonusBoardIntegratedFilterConfigs,
  BONUS_FILTER_EMPLOYEE_KEY,
  BONUS_FILTER_PROJECT_KEY,
  BONUS_FILTER_TYPE_KEY,
} from '@/features/finance/components/bonus/build-bonus-board-integrated-filter-configs';
import {
  BonusBoardColumns,
  employeeDisplayName,
  projectLabel,
  uniqueEmployeesFromRows,
  uniqueProjectsFromRows,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { useBonusBoardCsvExport } from '@/features/finance/components/bonus/use-bonus-board-csv-export';
import { useBonusScopeStatsCsvExport } from '@/features/finance/components/bonus/use-bonus-scope-stats-csv-export';
import { bonusBoardPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  fetchAllBonusListRows,
  type BonusEntryListRow,
  type BonusStats,
  type BonusType,
} from '@/lib/api/bonus';

export function BonusBoardPageContent() {
  useFinanceDocumentTitle(bonusBoardPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<BonusEntryListRow[]>([]);
  const [stats, setStats] = useState<BonusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BonusType | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [view, setView] = useState<BonusBoardViewMode>(() => readBonusBoardViewMode());
  const [createOpen, setCreateOpen] = useState(false);

  const handleViewChange = useCallback((mode: BonusBoardViewMode) => {
    setView(mode);
    writeBonusBoardViewMode(mode);
  }, []);

  useEffect(() => {
    const raw = searchParams.get(BONUS_BOARD_PROJECT_FILTER_QUERY)?.trim();
    setProjectFilter(raw && raw.length > 0 ? raw : 'ALL');
  }, [searchParams]);

  const replaceBonusUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const openBonusEntryId = searchParams.get(BONUS_BOARD_OPEN_ENTRY_QUERY)?.trim() || null;

  const ledgerEntry = useMemo(() => {
    if (!openBonusEntryId) return null;
    return rows.find((r) => r.id === openBonusEntryId) ?? null;
  }, [openBonusEntryId, rows]);

  const ledgerOpen = Boolean(openBonusEntryId && ledgerEntry);

  const openReleaseLedger = useCallback(
    (row: BonusEntryListRow) => {
      replaceBonusUrl((params) => {
        params.set(BONUS_BOARD_OPEN_ENTRY_QUERY, row.id);
      });
    },
    [replaceBonusUrl],
  );

  useEffect(() => {
    if (loading || !openBonusEntryId) return;
    if (!rows.some((r) => r.id === openBonusEntryId)) {
      replaceBonusUrl((params) => {
        params.delete(BONUS_BOARD_OPEN_ENTRY_QUERY);
      });
    }
  }, [loading, openBonusEntryId, rows, replaceBonusUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const scopedProjectId = projectFilter !== 'ALL' ? projectFilter : undefined;
    try {
      const itemsResult = await fetchAllBonusListRows(
        scopedProjectId ? { projectId: scopedProjectId } : undefined,
      );
      setRows(itemsResult);

      if (scopedProjectId) {
        setStats(null);
      } else {
        try {
          const statsResult = await bonusesApi.getStats();
          setStats(statsResult);
        } catch {
          setStats(null);
        }
      }
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Bonuses could not be loaded. Try again shortly.'));
      setRows([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [projectFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const uniqueEmployees = useMemo(() => uniqueEmployeesFromRows(rows), [rows]);
  const uniqueProjects = useMemo(() => uniqueProjectsFromRows(rows), [rows]);

  const projectSelectOptions = useMemo(() => {
    if (projectFilter === 'ALL') return uniqueProjects;
    if (uniqueProjects.some((p) => p.id === projectFilter)) return uniqueProjects;
    return [
      { id: projectFilter, code: '—', label: 'Project filter (no matching rows loaded)' },
      ...uniqueProjects,
    ];
  }, [uniqueProjects, projectFilter]);

  const handleProjectFilterChange = useCallback(
    (value: string) => {
      setProjectFilter(value);
      replaceBonusUrl((params) => {
        if (value === 'ALL') {
          params.delete(BONUS_BOARD_PROJECT_FILTER_QUERY);
        } else {
          params.set(BONUS_BOARD_PROJECT_FILTER_QUERY, value);
        }
      });
    },
    [replaceBonusUrl],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const name = employeeDisplayName(row.employee).toLowerCase();
      const proj = projectLabel(row.project)?.toLowerCase() ?? '';
      const orderCode = row.order?.code?.toLowerCase() ?? '';
      const matchesSearch = !q || name.includes(q) || proj.includes(q) || orderCode.includes(q);
      const matchesType = typeFilter === 'ALL' || row.type === typeFilter;
      const matchesEmployee = employeeFilter === 'ALL' || row.employee.id === employeeFilter;
      const matchesProject = projectFilter === 'ALL' || row.projectId === projectFilter;
      return matchesSearch && matchesType && matchesEmployee && matchesProject;
    });
  }, [rows, search, typeFilter, employeeFilter, projectFilter]);

  const serverProjectScope =
    projectFilter !== 'ALL' && projectFilter.trim().length > 0 ? projectFilter : undefined;

  const { exportCsvSubmitting, handleExportCsv } = useBonusBoardCsvExport(
    filtered,
    serverProjectScope,
  );

  const { handleExportScopeStatsCsv } = useBonusScopeStatsCsvExport(stats);

  const bonusFilterConfigs = useMemo(
    () =>
      buildBonusBoardIntegratedFilterConfigs(
        projectSelectOptions.map((p) => ({ id: p.id, label: p.label })),
        uniqueEmployees,
      ),
    [projectSelectOptions, uniqueEmployees],
  );

  const bonusFilterValues = useMemo(
    () => ({
      [BONUS_FILTER_TYPE_KEY]: typeFilter === 'ALL' ? 'all' : typeFilter,
      [BONUS_FILTER_PROJECT_KEY]: projectFilter === 'ALL' ? 'all' : projectFilter,
      [BONUS_FILTER_EMPLOYEE_KEY]: employeeFilter === 'ALL' ? 'all' : employeeFilter,
    }),
    [employeeFilter, projectFilter, typeFilter],
  );

  const handleBonusFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === BONUS_FILTER_TYPE_KEY) {
        setTypeFilter(value === 'all' ? 'ALL' : (value as BonusType));
        return;
      }
      if (key === BONUS_FILTER_PROJECT_KEY) {
        handleProjectFilterChange(value === 'all' ? 'ALL' : value);
        return;
      }
      if (key === BONUS_FILTER_EMPLOYEE_KEY) {
        setEmployeeFilter(value === 'all' ? 'ALL' : value);
      }
    },
    [handleProjectFilterChange],
  );

  const handleClearBonusFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('ALL');
    setEmployeeFilter('ALL');
    handleProjectFilterChange('ALL');
  }, [handleProjectFilterChange]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by employee, project, or order…"
          filters={bonusFilterConfigs}
          filterValues={bonusFilterValues}
          onFilterChange={handleBonusFilterChange}
          onClearAll={handleClearBonusFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={BONUS_BOARD_VIEW_OPTIONS}
        />
      ),
      trailing: (
        <>
          <BonusBoardPageSettingsSheet
            statsExportDisabled={loading || !stats}
            exportCsvDisabled={exportCsvSubmitting || filtered.length === 0}
            exportCsvInProgress={exportCsvSubmitting}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
          />
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            Create bonus
          </Button>
        </>
      ),
    }),
    [
      bonusFilterConfigs,
      bonusFilterValues,
      exportCsvSubmitting,
      filtered.length,
      handleBonusFilterChange,
      handleClearBonusFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleViewChange,
      loading,
      search,
      stats,
      view,
    ],
  );

  const filteredTotals = useMemo(() => computeBonusBoardFilteredTotals(filtered), [filtered]);

  const boardBody = useMemo(() => {
    switch (view) {
      case 'list':
        return <BonusBoardListView rows={filtered} onOpenReleases={openReleaseLedger} />;
      case 'employee':
        return <BonusBoardEmployeeView rows={filtered} onOpenReleases={openReleaseLedger} />;
      case 'product':
        return <BonusBoardProductView rows={filtered} onOpenReleases={openReleaseLedger} />;
      case 'payroll':
        return <BonusBoardPayrollMonthView rows={filtered} onOpenReleases={openReleaseLedger} />;
      default:
        return <BonusBoardColumns filtered={filtered} onOpenReleases={openReleaseLedger} />;
    }
  }, [filtered, openReleaseLedger, view]);

  useModuleHeroSlots(moduleHeroSlots);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <CreateManualBonusDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No matching bonuses"
          description="Adjust search or filters, or create a manual bonus."
          action={null}
        />
      ) : (
        <>
          <BonusBoardFilteredTotalsBar totals={filteredTotals} />
          {boardBody}
        </>
      )}

      <BonusEntryReleasesSheet
        entry={ledgerEntry}
        open={ledgerOpen}
        onOpenChange={(next) => {
          if (!next) {
            replaceBonusUrl((params) => {
              params.delete(BONUS_BOARD_OPEN_ENTRY_QUERY);
            });
          }
        }}
        onAfterPatch={() => void load()}
      />
    </div>
  );
}
