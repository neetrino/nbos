'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Hash, CheckCircle2, TrendingUp } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  BonusBoardColumns,
  BonusBoardToolbar,
  SummaryCard,
  employeeDisplayName,
  parseBonusAmount,
  projectLabel,
  uniqueEmployeesFromRows,
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

export default function BonusPage() {
  useFinanceDocumentTitle('Bonus Board');

  const [rows, setRows] = useState<BonusEntryListRow[]>([]);
  const [stats, setStats] = useState<BonusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BonusType | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsResult, statsResult] = await Promise.allSettled([
        fetchAllBonusListRows(),
        bonusesApi.getStats(),
      ]);

      if (itemsResult.status === 'rejected') {
        setError(
          getApiErrorMessage(itemsResult.reason, 'Bonuses could not be loaded. Try again shortly.'),
        );
        setRows([]);
        setStats(null);
        return;
      }

      setRows(itemsResult.value);
      setStats(statsResult.status === 'fulfilled' ? statsResult.value : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uniqueEmployees = useMemo(() => uniqueEmployeesFromRows(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const name = employeeDisplayName(row.employee).toLowerCase();
      const proj = projectLabel(row.project)?.toLowerCase() ?? '';
      const orderCode = row.order?.code?.toLowerCase() ?? '';
      const matchesSearch = !q || name.includes(q) || proj.includes(q) || orderCode.includes(q);
      const matchesType = typeFilter === 'ALL' || row.type === typeFilter;
      const matchesEmployee = employeeFilter === 'ALL' || row.employee.id === employeeFilter;
      return matchesSearch && matchesType && matchesEmployee;
    });
  }, [rows, search, typeFilter, employeeFilter]);

  const totalAmountDisplay = useMemo(() => {
    if (stats?.totalAmount != null && stats.totalAmount !== '') {
      return formatAmount(parseBonusAmount(stats.totalAmount));
    }
    const sum = rows.reduce((acc, r) => acc + parseBonusAmount(r.amount), 0);
    return formatAmount(sum);
  }, [stats, rows]);

  const paidCountDisplay = useMemo(() => {
    const fromStats = stats?.byStatus.find((s) => s.status === 'PAID')?._count;
    if (typeof fromStats === 'number') return String(fromStats);
    return String(rows.filter((r) => r.status === 'PAID').length);
  }, [stats, rows]);

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
        employeeFilter={employeeFilter}
        onEmployeeFilterChange={setEmployeeFilter}
        uniqueEmployees={uniqueEmployees}
      />

      <BonusBoardColumns filtered={filtered} />
    </div>
  );
}
