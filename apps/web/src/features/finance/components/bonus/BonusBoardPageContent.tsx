'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Hash, CheckCircle2, TrendingUp } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ErrorState, LoadingState } from '@/components/shared';
import { BONUS_BOARD_PROJECT_FILTER_QUERY } from '@/features/finance/constants/bonus-board-url';
import {
  BonusBoardColumns,
  BonusBoardToolbar,
  SummaryCard,
  employeeDisplayName,
  parseBonusAmount,
  projectLabel,
  uniqueEmployeesFromRows,
  uniqueProjectsFromRows,
} from '@/features/finance/components/bonus/bonus-board-widgets';
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

  const totalAmountDisplay = useMemo(() => {
    if (stats?.totalAmount != null && stats.totalAmount !== '' && projectFilter === 'ALL') {
      return formatAmount(parseBonusAmount(stats.totalAmount));
    }
    const sum = rows.reduce((acc, r) => acc + parseBonusAmount(r.amount), 0);
    return formatAmount(sum);
  }, [stats, rows, projectFilter]);

  const paidCountDisplay = useMemo(() => {
    if (projectFilter === 'ALL') {
      const fromStats = stats?.byStatus.find((s) => s.status === 'PAID')?._count;
      if (typeof fromStats === 'number') return String(fromStats);
    }
    return String(rows.filter((r) => r.status === 'PAID').length);
  }, [stats, rows, projectFilter]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} bonuses &middot; {uniqueEmployees.length} employees
            {projectFilter !== 'ALL' ? (
              <span className="text-foreground"> &middot; project scope (server filter)</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Bonuses" value={String(rows.length)} icon={Hash} />
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
