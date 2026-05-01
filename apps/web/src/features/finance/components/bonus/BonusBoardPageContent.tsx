'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, Hash, Loader2, TableProperties, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, LoadingState } from '@/components/shared';
import { BONUS_BOARD_PROJECT_FILTER_QUERY } from '@/features/finance/constants/bonus-board-url';
import {
  BonusBoardColumns,
  BonusBoardToolbar,
  SummaryCard,
  countBonusEntriesWithStatus,
  employeeDisplayName,
  parseBonusAmount,
  projectLabel,
  sumBonusEntryAmounts,
  uniqueEmployeesFromRows,
  uniqueProjectsFromRows,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { useBonusBoardCsvExport } from '@/features/finance/components/bonus/use-bonus-board-csv-export';
import { useBonusScopeStatsCsvExport } from '@/features/finance/components/bonus/use-bonus-scope-stats-csv-export';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  fetchAllBonusListRows,
  type BonusEntryListRow,
  type BonusStats,
  type BonusType,
} from '@/lib/api/bonus';

export function BonusBoardPageContent() {
  useFinanceDocumentTitle('Bonus Board');

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

  const canUseGlobalBonusStats = useMemo(
    () =>
      search.trim() === '' &&
      typeFilter === 'ALL' &&
      employeeFilter === 'ALL' &&
      projectFilter === 'ALL',
    [search, typeFilter, employeeFilter, projectFilter],
  );

  const totalAmountDisplay = useMemo(() => {
    if (canUseGlobalBonusStats && stats?.totalAmount != null && stats.totalAmount !== '') {
      return formatAmount(parseBonusAmount(stats.totalAmount));
    }
    return formatAmount(sumBonusEntryAmounts(filtered));
  }, [canUseGlobalBonusStats, stats, filtered]);

  const paidCountDisplay = useMemo(() => {
    if (canUseGlobalBonusStats && stats) {
      const fromStats = stats.byStatus.find((s) => s.status === 'PAID')?._count;
      if (typeof fromStats === 'number') return String(fromStats);
    }
    return String(countBonusEntriesWithStatus(filtered, 'PAID'));
  }, [canUseGlobalBonusStats, stats, filtered]);

  const visibleEmployeeCount = useMemo(() => uniqueEmployeesFromRows(filtered).length, [filtered]);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="mb-4">
          <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">Loading…</p>
        </div>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="mb-4">
          <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
        </div>
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length === rows.length ? (
              <>
                {rows.length} bonuses &middot; {visibleEmployeeCount} employees
              </>
            ) : (
              <>
                {filtered.length} visible of {rows.length} &middot; {visibleEmployeeCount} employees
              </>
            )}
            {projectFilter !== 'ALL' ? (
              <span className="text-foreground"> &middot; project scope (server filter)</span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || !stats}
            onClick={() => handleExportScopeStatsCsv()}
            aria-label="Export bonus scope statistics as CSV"
            title="UTF-8 CSV from GET /api/bonus/stats (global workspace totals; board filters not applied—see scope_note). Unavailable when list uses server ?projectId=."
          >
            <TableProperties size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exportCsvSubmitting || filtered.length === 0}
            onClick={() => handleExportCsv()}
            title="UTF-8 CSV of visible rows plus a final amount total row (same filters as the board)"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Download size={14} aria-hidden />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Bonuses" value={String(filtered.length)} icon={Hash} />
        <SummaryCard label="Total Amount" value={totalAmountDisplay} icon={TrendingUp} accent />
        <SummaryCard label="Paid" value={paidCountDisplay} icon={CheckCircle2} />
      </div>

      <BonusBoardToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={handleProjectFilterChange}
        uniqueProjects={projectSelectOptions}
        employeeFilter={employeeFilter}
        onEmployeeFilterChange={setEmployeeFilter}
        uniqueEmployees={uniqueEmployees}
      />

      <BonusBoardColumns filtered={filtered} />
    </div>
  );
}
