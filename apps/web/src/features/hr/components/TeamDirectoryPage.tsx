'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Plus, UserPlus, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IntegratedSearchFilters,
  ViewModeSwitch,
  EmptyState,
  ErrorState,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { EMPLOYEE_LEVELS, EMPLOYEE_STATUSES, isEmployeeLevelValue } from '@/features/hr/constants/hr';
import { CreateEmployeeSheet } from '@/features/hr/components/CreateEmployeeSheet';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { InviteEmployeeDialog } from '@/features/hr/components/InviteEmployeeDialog';
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
import { PermissionGate, usePermission } from '@/lib/permissions';
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const effectiveStatus = useMemo(() => {
    if (quickStatus) return quickStatus;
    if (filters.status && filters.status !== 'all') return filters.status;
    if (showTerminated) return 'TERMINATED';
    return undefined;
  }, [quickStatus, filters.status, showTerminated]);

  const { employees, total, roles, departments, loading, refreshing, error, refetch } =
    useTeamDirectory(search, filters, effectiveStatus);

  const openFromLink = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setSheetOpen(true);
  }, []);
  const { stripOpenEmployeeFromUrl, pushOpenEmployeeToUrl } = useTeamEmployeeDeepLink(
    employees,
    loading,
    openFromLink,
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const emp of employees) {
      counts[emp.status] = (counts[emp.status] ?? 0) + 1;
    }
    return counts;
  }, [employees]);

  const activeCount = statusCounts.ACTIVE ?? 0;
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
        options: EMPLOYEE_STATUSES.map((s) => ({
          value: s.value,
          label: t(`status.${s.value}`),
        })),
      },
    ],
    [roles, departments, t],
  );

  const handleDirectoryRefresh = useCallback(async () => {
    invalidateEmployeeDirectoryCaches();
    await refetch();
  }, [refetch]);

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
      trailing: (
        <>
          <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
            {t('directory.counts', { active: activeCount, total })}
          </span>
          <PermissionGate module="COMPANY" action="ADD">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button {...props} type="button">
                    <Plus size={16} aria-hidden />
                    {t('directory.add')}
                    <ChevronDown className="ml-1 size-4 opacity-70" aria-hidden />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <Users2 className="mr-2 size-4" />
                  {t('directory.createEmployee')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 size-4" />
                  {t('directory.sendInvitation')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        </>
      ),
    }),
    [activeCount, filterConfigs, filters, search, setFilters, t, total, view, viewOptions],
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
        onStatusChange={handleQuickStatus}
        counts={statusCounts}
        showTerminated={showTerminated}
        onToggleTerminated={handleToggleTerminated}
        terminatedCount={statusCounts.TERMINATED ?? 0}
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
          action={
            <PermissionGate module="COMPANY" action="ADD">
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={16} /> {t('directory.createEmployee')}
                </Button>
                <Button variant="outline" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={16} /> {t('directory.sendInvitation')}
                </Button>
              </div>
            </PermissionGate>
          }
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

      <CreateEmployeeSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(emp) => {
          void handleDirectoryRefresh().then(() => openSheet(emp));
        }}
      />

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => void handleDirectoryRefresh()}
      />

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
