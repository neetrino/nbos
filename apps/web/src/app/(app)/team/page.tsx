'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  Users2,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_LEVELS,
  EMPLOYEE_STATUSES,
  getEmployeeLevel,
  getEmployeeStatus,
} from '@/features/hr/constants/hr';
import { api } from '@/lib/api';

interface Employee {
  id: string;
  fullName: string;
  avatar: string | null;
  department: string | null;
  role: string;
  level: string;
  status: string;
  email: string;
  phone: string | null;
  telegram: string | null;
  hireDate: string;
}

type ViewMode = 'list' | 'grid';

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('grid');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/employees', {
        params: {
          pageSize: 100,
          search: search || undefined,
          role: filters.role && filters.role !== 'all' ? filters.role : undefined,
          level: filters.level && filters.level !== 'all' ? filters.level : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        },
      });
      setEmployees(resp.data.items ?? resp.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;

  const filterConfigs = [
    {
      key: 'role',
      label: 'Role',
      options: EMPLOYEE_ROLES.map((r) => ({ value: r.value, label: r.label })),
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
  ];

  function tenure(hireDate: string): string {
    const diff = Date.now() - new Date(hireDate).getTime();
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
    if (months < 1) return 'New';
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Team" description={`${activeCount} active employees`}>
        <Button variant="outline" size="icon" onClick={fetchEmployees}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-l-none"
          >
            <List size={14} />
          </Button>
        </div>
        <Button>
          <Plus size={16} />
          Add Employee
        </Button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, role..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No employees yet"
          description="Add your team members"
          action={
            <Button>
              <Plus size={16} /> Add First Employee
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((emp) => {
            const lvl = getEmployeeLevel(emp.level);
            const st = getEmployeeStatus(emp.status);
            return (
              <div
                key={emp.id}
                className="border-border bg-card cursor-pointer rounded-xl border p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-accent/15 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {emp.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{emp.fullName}</p>
                    <p className="text-muted-foreground text-xs">
                      {emp.role} {emp.department ? `· ${emp.department}` : ''}
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
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Calendar size={12} />
                    <span>Tenure: {tenure(emp.hireDate)}</span>
                  </div>
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
                const lvl = getEmployeeLevel(emp.level);
                const st = getEmployeeStatus(emp.status);
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-accent/15 text-accent flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold">
                          {emp.fullName
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium">{emp.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.role}</TableCell>
                    <TableCell>
                      {lvl && <StatusBadge label={lvl.label} variant={lvl.variant} />}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {emp.department ?? '—'}
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
    </div>
  );
}
