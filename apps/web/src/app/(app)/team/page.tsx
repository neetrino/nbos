'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Users2, LayoutGrid, List, Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHero,
  IntegratedSearchFilters,
  ViewModeSwitch,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  type ViewModeOption,
} from '@/components/shared';
import {
  EMPLOYEE_LEVELS,
  EMPLOYEE_STATUSES,
  getEmployeeLevel,
  getEmployeeStatus,
} from '@/features/hr/constants/hr';
import { PermissionGate } from '@/lib/permissions';
import { InviteEmployeeDialog } from '@/features/hr/components/InviteEmployeeDialog';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import { employeesApi, rolesApi, type Employee, type RoleItem } from '@/lib/api/employees';
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

function TeamPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('grid');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await employeesApi.getAll({
        pageSize: 100,
        search: search || undefined,
        roleId: filters.role && filters.role !== 'all' ? filters.role : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        departmentId:
          filters.department && filters.department !== 'all' ? filters.department : undefined,
      });
      setEmployees(items);
      setError(null);
    } catch {
      setError('Employees could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
    if (!openEmployeeId || loading) return;
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
        setEmployees((prev) => (prev.some((e) => e.id === emp.id) ? prev : [emp, ...prev]));
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

  useEffect(() => {
    rolesApi
      .getAll()
      .then((r) => setRoles(r ?? []))
      .catch(() => {});
  }, []);

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;

  const filterConfigs = useMemo(
    () => [
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
    [roles],
  );

  function fullName(emp: Employee) {
    return `${emp.firstName} ${emp.lastName}`;
  }

  function initials(emp: Employee) {
    return `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase();
  }

  function primaryDepartment(emp: Employee) {
    const primary = emp.departments?.find((d) => d.isPrimary);
    return primary?.department?.name ?? emp.departments?.[0]?.department?.name ?? null;
  }

  function tenure(hireDate: string | null): string {
    if (!hireDate) return '—';
    const diff = Date.now() - new Date(hireDate).getTime();
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
    if (months < 1) return 'New';
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
  }

  function openSheet(emp: Employee) {
    pushOpenEmployeeToUrl(emp.id);
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Team"
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email…"
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearAll={() => setFilters({})}
          />
        }
        viewMode={<ViewModeSwitch value={view} onChange={setView} options={TEAM_VIEW_OPTIONS} />}
        trailing={
          <>
            <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
              {activeCount} active
            </span>
            <PermissionGate module="COMPANY" action="ADD">
              <Button type="button" onClick={() => setInviteOpen(true)}>
                <Plus size={16} aria-hidden />
                Invite Employee
              </Button>
            </PermissionGate>
          </>
        }
      />

      {loading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchEmployees} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No employees yet"
          description="Invite your team members"
          action={
            <PermissionGate module="COMPANY" action="ADD">
              <Button onClick={() => setInviteOpen(true)}>
                <Plus size={16} /> Invite First Employee
              </Button>
            </PermissionGate>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((emp) => {
            const lvl = emp.level ? getEmployeeLevel(emp.level) : null;
            const st = getEmployeeStatus(emp.status);
            const dept = primaryDepartment(emp);
            return (
              <div
                key={emp.id}
                onClick={() => openSheet(emp)}
                className="border-border bg-card cursor-pointer rounded-xl border p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-accent/15 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {initials(emp)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{fullName(emp)}</p>
                    <p className="text-muted-foreground text-xs">
                      {emp.role?.name ?? '—'} {dept ? `· ${dept}` : ''}
                    </p>
                  </div>
                  {st && <StatusBadge label={st.label} variant={st.variant} />}
                </div>

                <div className="mt-4 space-y-1.5">
                  {lvl && (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Building2 size={12} />
                      <StatusBadge label={lvl.label} variant={lvl.variant} />
                    </div>
                  )}
                  {emp.email && (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Mail size={12} />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Phone size={12} />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.hireDate && (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Calendar size={12} />
                      <span>Tenure: {tenure(emp.hireDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const lvl = emp.level ? getEmployeeLevel(emp.level) : null;
                const st = getEmployeeStatus(emp.status);
                return (
                  <TableRow key={emp.id} className="cursor-pointer" onClick={() => openSheet(emp)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-accent/15 text-accent flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold">
                          {initials(emp)}
                        </div>
                        <span className="font-medium">{fullName(emp)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.role?.name ?? '—'}</TableCell>
                    <TableCell>
                      {lvl && <StatusBadge label={lvl.label} variant={lvl.variant} />}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {primaryDepartment(emp) ?? '—'}
                    </TableCell>
                    <TableCell>
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tenure(emp.hireDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{emp.email}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={fetchEmployees}
      />

      <EmployeeSheet
        employee={selectedEmployee}
        open={sheetOpen}
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

export default function TeamPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TeamPageContent />
    </Suspense>
  );
}
