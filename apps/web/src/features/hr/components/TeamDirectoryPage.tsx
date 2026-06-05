'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, LayoutGrid, List, Plus, UserPlus, Users2 } from 'lucide-react';
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
  type ViewModeOption,
} from '@/components/shared';
import { EMPLOYEE_LEVELS, EMPLOYEE_STATUSES } from '@/features/hr/constants/hr';
import { CreateEmployeeSheet } from '@/features/hr/components/CreateEmployeeSheet';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { InviteEmployeeDialog } from '@/features/hr/components/InviteEmployeeDialog';
import { TeamEmployeeCard } from '@/features/hr/components/TeamEmployeeCard';
import { TeamEmployeeTable } from '@/features/hr/components/TeamEmployeeTable';
import { TeamStatusChips } from '@/features/hr/components/TeamStatusChips';
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import { useTeamDirectory } from '@/features/hr/hooks/use-team-directory';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { invalidateEmployeeDirectoryCaches } from '@/lib/employees';
import { PermissionGate, usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'list' | 'grid';

const TEAM_VIEW_OPTIONS: ViewModeOption<ViewMode>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Grid view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

function TeamDirectoryPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = usePermission();
  const canEdit = can('EDIT', 'COMPANY');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [quickStatus, setQuickStatus] = useState<string | null>(null);
  const [showTerminated, setShowTerminated] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
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

  const openEmployeeId = searchParams.get(TEAM_OPEN_EMPLOYEE_QUERY)?.trim() || null;
  const deepLinkEmployeeAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkEmployeeAttemptedRef.current = null;
  }, [openEmployeeId]);

  const stripOpenEmployeeFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(TEAM_OPEN_EMPLOYEE_QUERY)) return;
    params.delete(TEAM_OPEN_EMPLOYEE_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenEmployeeToUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(TEAM_OPEN_EMPLOYEE_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!openEmployeeId || (loading && employees.length === 0)) return;
    const match = employees.find((e) => e.id === openEmployeeId);
    if (match) {
      setSelectedEmployee(match);
      setSheetOpen(true);
      return;
    }
    if (deepLinkEmployeeAttemptedRef.current === openEmployeeId) return;
    deepLinkEmployeeAttemptedRef.current = openEmployeeId;
    let cancelled = false;
    void (async () => {
      try {
        const emp = await employeesApi.getById(openEmployeeId);
        if (cancelled) return;
        setSelectedEmployee(emp);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Employee not found or you cannot open this profile.');
          stripOpenEmployeeFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openEmployeeId, loading, employees, stripOpenEmployeeFromUrl]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const emp of employees) {
      counts[emp.status] = (counts[emp.status] ?? 0) + 1;
    }
    return counts;
  }, [employees]);

  const activeCount = statusCounts.ACTIVE ?? 0;

  const filterConfigs = useMemo(
    () => [
      {
        key: 'department',
        label: 'Department',
        options: departments.map((d) => ({ value: d.id, label: d.name })),
      },
      {
        key: 'role',
        label: 'Role',
        options: roles.map((r) => ({ value: r.id, label: r.name })),
      },
      {
        key: 'level',
        label: 'Level',
        options: EMPLOYEE_LEVELS.map((l) => ({ value: l.value, label: l.label })),
      },
      {
        key: 'status',
        label: 'Status',
        options: EMPLOYEE_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      },
    ],
    [roles, departments],
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
          searchPlaceholder="Search by name, email…"
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
      viewMode: <ViewModeSwitch value={view} onChange={setView} options={TEAM_VIEW_OPTIONS} />,
      trailing: (
        <>
          <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
            {activeCount} active · {total} total
          </span>
          <PermissionGate module="COMPANY" action="ADD">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button {...props} type="button">
                    <Plus size={16} aria-hidden />
                    Add
                    <ChevronDown className="ml-1 size-4 opacity-70" aria-hidden />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <Users2 className="mr-2 size-4" />
                  Create employee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 size-4" />
                  Send invitation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        </>
      ),
    }),
    [activeCount, filterConfigs, filters, search, total, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  function openSheet(emp: Employee) {
    setSelectedEmployee(emp);
    setSheetOpen(true);
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
    <>
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
          title="No employees yet"
          description="Create a profile or send an invitation to grow your team directory."
          action={
            <PermissionGate module="COMPANY" action="ADD">
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={16} /> Create employee
                </Button>
                <Button variant="outline" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={16} /> Send invitation
                </Button>
              </div>
            </PermissionGate>
          }
        />
      ) : (
        <div className={cn('flex flex-col gap-4', refreshing && 'opacity-80')}>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </>
  );
}

export function TeamDirectoryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamDirectoryPageContent />
    </Suspense>
  );
}
