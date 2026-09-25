'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeDollarSign } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { employeesApi, type Employee } from '@/lib/api/employees';
import {
  compensationProfilesApi,
  type ActiveCompensationSummary,
} from '@/lib/api/compensation-profiles';
import { getApiErrorMessage } from '@/lib/api-errors';
import { teamDirectoryCardGridClass } from '@/features/hr/constants/team-directory';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import { cn } from '@/lib/utils';
import { SalaryEmployeeCard } from './salary-employee-card';
import { SalaryProfileSheet } from './salary-profile-sheet';

type SalaryFilter = 'all' | 'missing';

function hasSalary(employee: Employee, summary: ActiveCompensationSummary | undefined): boolean {
  const salary = summary?.baseSalary ?? employee.baseSalary;
  return salary != null && salary !== '' && salary !== '0' && salary !== '0.00';
}

export function SalaryDirectoryPage() {
  const t = useTranslations('hr.salaries');
  const sidebarCollapsed = useAppSidebarCollapsed();
  const linkedId = useSearchParams().get('employee') ?? '';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summaries, setSummaries] = useState<ActiveCompensationSummary[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SalaryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [people, active] = await Promise.all([
          employeesApi.getAll({ page: 1, pageSize: 500 }),
          compensationProfilesApi.listActive(),
        ]);
        setEmployees(people.items);
        setSummaries(active.items);
        setError(null);
      } catch (caught) {
        setError(getApiErrorMessage(caught, t('loadFailed')));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, ActiveCompensationSummary>();
    for (const row of summaries) map.set(row.employeeId, row);
    return map;
  }, [summaries]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const summary = byEmployee.get(employee.id);
      if (filter === 'missing' && hasSalary(employee, summary)) return false;
      if (!query) return true;
      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return name.includes(query) || employee.role.name.toLowerCase().includes(query);
    });
  }, [byEmployee, employees, filter, search]);

  useModuleHeroSlots(
    useMemo(
      () => ({
        search: (
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t('search')}
          />
        ),
        trailing: (
          <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
            {t('counts', {
              configured: employees.filter((employee) =>
                hasSalary(employee, byEmployee.get(employee.id)),
              ).length,
              total: employees.length,
            })}
          </span>
        ),
      }),
      [byEmployee, employees, search, t],
    ),
  );

  useEffect(() => {
    if (!linkedId || employees.length === 0) return;
    const match = employees.find((employee) => employee.id === linkedId);
    if (!match) return;
    setSelected(match);
    setSheetOpen(true);
  }, [employees, linkedId]);

  function refreshSummaries() {
    void compensationProfilesApi.listActive().then((resp) => setSummaries(resp.items));
  }

  if (loading && employees.length === 0) return <LoadingState variant="cards" count={6} />;
  if (error && employees.length === 0) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} label={t('all')} onClick={() => setFilter('all')} />
        <FilterChip
          active={filter === 'missing'}
          label={t('missing')}
          onClick={() => setFilter('missing')}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={BadgeDollarSign}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <div className={teamDirectoryCardGridClass(sidebarCollapsed)}>
          {visible.map((employee) => (
            <SalaryEmployeeCard
              key={employee.id}
              employee={employee}
              summary={byEmployee.get(employee.id)}
              onOpen={(person) => {
                setSelected(person);
                setSheetOpen(true);
              }}
            />
          ))}
        </div>
      )}
      <SalaryProfileSheet
        employee={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSalaryActivated={() => refreshSummaries()}
      />
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
