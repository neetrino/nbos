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
import { DirectoryCountChip } from '@/features/hr/components/TeamStatusChips';
import { teamDirectoryCardGridClass } from '@/features/hr/constants/team-directory';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import { SalaryEmployeeCard } from './salary-employee-card';
import { SalaryProfileSheet } from './salary-profile-sheet';
import {
  salaryDirectoryChipCounts,
  salaryDirectoryListParams,
  salaryEmployeeVisible,
  type SalaryDirectoryFilter,
} from './salary-directory-query';

type SalaryFilter = SalaryDirectoryFilter;

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
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [people, active] = await Promise.all([
          employeesApi.getAll(salaryDirectoryListParams('everyone')),
          compensationProfilesApi.listActive(),
        ]);
        if (cancelled) return;
        setEmployees(people.items);
        setSummaries(active.items);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        setError(getApiErrorMessage(caught, t('loadFailed')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, ActiveCompensationSummary>();
    for (const row of summaries) map.set(row.employeeId, row);
    return map;
  }, [summaries]);

  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return name.includes(query) || employee.role.name.toLowerCase().includes(query);
    });
  }, [employees, search]);

  const chipCounts = useMemo(
    () =>
      salaryDirectoryChipCounts(
        searched.map((employee) => ({
          status: employee.status,
          hasSalary: hasSalary(employee, byEmployee.get(employee.id)),
        })),
      ),
    [byEmployee, searched],
  );

  const visible = useMemo(
    () =>
      searched.filter((employee) =>
        salaryEmployeeVisible(
          filter,
          employee.status,
          hasSalary(employee, byEmployee.get(employee.id)),
        ),
      ),
    [byEmployee, filter, searched],
  );

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
      }),
      [search, t],
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
      <div className="flex flex-wrap items-center gap-2">
        <DirectoryCountChip
          active={filter === 'all'}
          label={t('all')}
          count={chipCounts.all}
          onClick={() => setFilter('all')}
        />
        <DirectoryCountChip
          active={filter === 'missing'}
          label={t('missing')}
          count={chipCounts.missing}
          onClick={() => setFilter('missing')}
        />
        <DirectoryCountChip
          active={filter === 'terminated'}
          label={t('terminated')}
          count={chipCounts.terminated}
          onClick={() => setFilter('terminated')}
        />
        <DirectoryCountChip
          active={filter === 'everyone'}
          label={t('everyone')}
          count={chipCounts.everyone}
          onClick={() => setFilter('everyone')}
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
