'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users2 } from 'lucide-react';
import {
  IntegratedSearchFilters,
  ViewModeSwitch,
  EmptyState,
  ErrorState,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import {
  EMPLOYEE_LEVELS,
  EMPLOYEE_STATUSES,
  isEmployeeLevelValue,
} from '@/features/hr/constants/hr';
import {
  EMPLOYEE_STATUS_TERMINATED,
  isDefaultTeamDirectoryScope,
  resolveTeamDirectoryStatusQuery,
  TEAM_DIRECTORY_STATUS_EVERYONE,
} from '@/features/hr/constants/team-directory-status';
import { useTeamDirectoryAdd } from '@/features/hr/components/team-directory-add';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { TeamEmployeeCard } from '@/features/hr/components/TeamEmployeeCard';
import { TeamEmployeeTable } from '@/features/hr/components/TeamEmployeeTable';
import { TeamStatusChips } from '@/features/hr/components/TeamStatusChips';
import {
  buildTeamDirectoryViewOptions,
  type TeamDirectoryViewMode,
} from '@/features/hr/components/team-directory-view-options';
import { teamDirectoryCardGridClass } from '@/features/hr/constants/team-directory';
import { useTeamDirectory } from '@/features/hr/hooks/use-team-directory';
import { useTeamEmployeeDeepLink } from '@/features/hr/hooks/use-team-employee-deep-link';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import type { Employee } from '@/lib/api/employees';
import { invalidateEmployeeDirectoryCaches } from '@/lib/employees';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';

function TeamDirectoryPageContent() {
  const t = useTranslations('hr');
  const sidebarCollapsed = useAppSidebarCollapsed();
  const { can } = usePermission();
  const canEdit = can('EDIT', 'COMPANY');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = usePersistedSearchFilters(SEARCH_FILTER_PAGE_ID.hrTeam);
  const [quickStatus, setQuickStatus] = useState<string | null>(null);
  const [showTerminated, setShowTerminated] = useState(false);
  const [view, setView] = useState<TeamDirectoryViewMode>('grid');
  const displayView = useMobilePreferredView(view, 'grid');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const statusQuery = useMemo(
    () =>
      resolveTeamDirectoryStatusQuery({
        quickStatus,
        filterStatus: filters.status,
        showTerminated,
      }),
    [quickStatus, filters.status, showTerminated],
  );
  const defaultScope = isDefaultTeamDirectoryScope({
    quickStatus,
    filterStatus: filters.status,
    showTerminated,
  });

  const { employees, roles, departments, loading, refreshing, statusTotals, error, refetch } =
    useTeamDirectory(search, filters, statusQuery);

  const openFromLink = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setSheetOpen(true);
  }, []);
  const { stripOpenEmployeeFromUrl, pushOpenEmployeeToUrl } = useTeamEmployeeDeepLink(
    employees,
    loading,
    openFromLink,
  );

  const allCount =
    (statusTotals.ACTIVE ?? 0) + (statusTotals.PROBATION ?? 0) + (statusTotals.ON_LEAVE ?? 0);
  const viewOptions = useMemo(() => buildTeamDirectoryViewOptions(t), [t]);

  const filterConfigs = useMemo(
    () => [
      {
        key: 'department',
        label: t('directory.filters.department'),
        options: departments.map((d) => ({ value: d.id, label: d.name })),
      },
      {
        key: 'role',
        label: t('directory.filters.role'),
        options: roles.map((r) => ({ value: r.id, label: r.name })),
      },
      {
        key: 'level',
        label: t('directory.filters.level'),
        options: EMPLOYEE_LEVELS.map((l) => ({
          value: l.value,
          label: isEmployeeLevelValue(l.value) ? t(`level.${l.value}`) : l.label,
        })),
      },
      {
        key: 'status',
        label: t('directory.filters.status'),
        options: [
          ...EMPLOYEE_STATUSES.map((s) => ({
            value: s.value,
            label: t(`status.${s.value}`),
          })),
          {
            value: TEAM_DIRECTORY_STATUS_EVERYONE,
            label: t('directory.includeTerminated'),
          },
        ],
      },
    ],
    [roles, departments, t],
  );

  const handleDirectoryRefresh = useCallback(async () => {
    invalidateEmployeeDirectoryCaches();
    await refetch();
  }, [refetch]);

  const add = useTeamDirectoryAdd({
    onEmployeeCreated: (emp) => {
      void handleDirectoryRefresh().then(() => openSheet(emp));
    },
    onChanged: () => void handleDirectoryRefresh(),
  });

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('directory.search')}
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => {
            setFilters((prev) => ({ ...prev, [key]: value }));
            if (key === 'status') setQuickStatus(null);
          }}
          onClearAll={() => {
            setFilters({});
            setQuickStatus(null);
            setShowTerminated(false);
          }}
        />
      ),
      viewMode: <ViewModeSwitch value={view} onChange={setView} options={viewOptions} />,
      trailing: add.menu,
    }),
    [add.menu, filterConfigs, filters, search, setFilters, t, view, viewOptions],
  );

  useModuleHeroSlots(moduleHeroSlots);

  function openSheet(emp: Employee) {
    openFromLink(emp);
    pushOpenEmployeeToUrl(emp.id);
  }

  function handleQuickStatus(status: string | null) {
    setQuickStatus(status);
    setShowTerminated(false);
    if (status) {
      setFilters((prev) => ({ ...prev, status: 'all' }));
    }
  }

  function handleToggleTerminated() {
    setShowTerminated((v) => !v);
    setQuickStatus(null);
    setFilters((prev) => ({ ...prev, status: 'all' }));
  }

  const showInitialLoading = loading && employees.length === 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <TeamStatusChips
        activeStatus={quickStatus}
        defaultScopeActive={defaultScope}
        onStatusChange={handleQuickStatus}
        counts={statusTotals}
        showTerminated={showTerminated}
        onToggleTerminated={handleToggleTerminated}
        terminatedCount={statusTotals[EMPLOYEE_STATUS_TERMINATED] ?? 0}
        allCount={allCount}
      />

      {showInitialLoading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void handleDirectoryRefresh()} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={t('directory.emptyTitle')}
          description={t('directory.emptyDescription')}
          action={add.buttons}
        />
      ) : (
        <div className={cn('flex flex-col gap-4', refreshing && 'opacity-80')}>
          {displayView === 'grid' ? (
            <div className={teamDirectoryCardGridClass(sidebarCollapsed)}>
              {employees.map((emp) => (
                <TeamEmployeeCard key={emp.id} employee={emp} onOpen={openSheet} />
              ))}
            </div>
          ) : (
            <TeamEmployeeTable employees={employees} onOpen={openSheet} />
          )}
        </div>
      )}

      {add.dialogs}

      <EmployeeSheet
        employee={selectedEmployee}
        open={sheetOpen}
        canEdit={canEdit}
        onSaved={() => void handleDirectoryRefresh()}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedEmployee(null);
            stripOpenEmployeeFromUrl();
          }
        }}
      />
    </div>
  );
}

export function TeamDirectoryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamDirectoryPageContent />
    </Suspense>
  );
}
