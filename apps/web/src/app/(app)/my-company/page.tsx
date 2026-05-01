'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  Network,
  RefreshCcw,
  ShieldCheck,
  Target,
  Users2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/shared';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';

const MY_COMPANY_SECTIONS = [
  {
    title: 'Team',
    href: '/my-company/team',
    description: 'Employees, profiles, invites, roles, and department membership.',
    icon: Users2,
  },
  {
    title: 'Departments',
    href: '/my-company/departments',
    description: 'Company departments, hierarchy, owners, and members.',
    icon: Building2,
  },
  {
    title: 'Roles & Seats',
    href: '/my-company/roles-seats',
    description: 'Business seats and accountabilities, separated from technical permissions.',
    icon: ShieldCheck,
  },
  {
    title: 'Compensation',
    href: '/my-company/compensation',
    description: 'Compensation profiles, bonus policies, and payroll-facing rules.',
    icon: BadgeDollarSign,
  },
  {
    title: 'KPI / Scorecard',
    href: '/my-company/kpi',
    description: 'Company, department, and employee KPI policies and scorecards.',
    icon: Target,
  },
  {
    title: 'SOP & Templates',
    href: '/my-company/sop',
    description: 'SOP documents, process templates, and operational runs.',
    icon: ClipboardList,
  },
] as const;

const FOUNDATION_GAPS = [
  'Seat assignments are not modelled separately from technical permission roles yet.',
  'Compensation, KPI and bonus policies are visible as module areas but not payroll sources yet.',
  'The full org chart canvas with zoom, search and department drawers remains a dedicated follow-up.',
] as const;

function getPrimaryDepartment(employee: Employee): string | null {
  const primary = employee.departments.find((membership) => membership.isPrimary);
  return primary?.department.name ?? employee.departments[0]?.department.name ?? null;
}

function countActiveEmployees(employees: Employee[]): number {
  return employees.filter((employee) => employee.status === 'ACTIVE').length;
}

export default function MyCompanyPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoundation = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesData, departmentsData, rolesData] = await Promise.all([
        employeesApi.getAll({ pageSize: 100 }),
        departmentsApi.getAll(),
        rolesApi.getAll(),
      ]);
      setEmployees(employeesData.items);
      setDepartments(departmentsData);
      setRoles(rolesData);
      setError(null);
    } catch {
      setError(
        'My Company foundation data could not be loaded. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoundation();
  }, [fetchFoundation]);

  const activeEmployees = countActiveEmployees(employees);
  const assignedEmployees = employees.filter((employee) => employee.departments.length > 0).length;
  const systemRoles = roles.filter((role) => role.isSystem).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Company"
        description="Org Structure is the company control center for departments, seats, employees, KPI, compensation, and SOP."
      >
        <Button variant="outline" size="sm" onClick={fetchFoundation}>
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchFoundation} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <FoundationMetric
              label="Active employees"
              value={activeEmployees}
              helper="Can work in platform modules"
            />
            <FoundationMetric
              label="Departments"
              value={departments.length}
              helper="Org units used for access context"
            />
            <FoundationMetric
              label="Permission roles"
              value={roles.length}
              helper={`${systemRoles} protected system roles`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <Network size={20} />
                  </div>
                  <div>
                    <h2 className="text-foreground text-lg font-semibold">
                      Org Structure Foundation
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Current department hierarchy and employee assignment coverage.
                    </p>
                  </div>
                </div>
                <StatusBadge
                  label={`${assignedEmployees}/${employees.length} assigned`}
                  variant={assignedEmployees === employees.length ? 'emerald' : 'amber'}
                />
              </div>

              {departments.length === 0 ? (
                <div className="border-border rounded-xl border border-dashed p-6 text-center">
                  <Building2 size={32} className="text-muted-foreground/40 mx-auto" />
                  <p className="text-foreground mt-3 text-sm font-medium">
                    No departments configured
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Add departments before using Org Structure as an accountability map.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {departments.map((department) => (
                    <DepartmentFoundationCard key={department.id} department={department} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3">
              {MY_COMPANY_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="border-border bg-card hover:bg-muted/40 block rounded-2xl border p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-secondary text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-border bg-card rounded-2xl border p-5">
            <h2 className="text-foreground text-base font-semibold">Foundation guardrails</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              These are intentionally explicit so Finance, KPI and RBAC do not rely on incomplete
              data.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {FOUNDATION_GAPS.map((gap) => (
                <div key={gap} className="bg-muted/40 rounded-xl p-4">
                  <p className="text-muted-foreground text-sm">{gap}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-card rounded-2xl border p-5">
            <h2 className="text-foreground text-base font-semibold">Recent team context</h2>
            {employees.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                No employees found. Invite employees before using My Company as a control center.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {employees.slice(0, 6).map((employee) => (
                  <div key={employee.id} className="border-border rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {employee.role.name} · {getPrimaryDepartment(employee) ?? 'No department'}
                        </p>
                      </div>
                      <StatusBadge
                        label={employee.status.replace(/_/g, ' ')}
                        variant={employee.status === 'ACTIVE' ? 'emerald' : 'amber'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FoundationMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-foreground mt-2 text-3xl font-semibold">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{helper}</p>
    </div>
  );
}

function DepartmentFoundationCard({ department }: { department: DepartmentItem }) {
  return (
    <div className="border-border rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-foreground text-sm font-medium">{department.name}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {department.parent?.name
              ? `Reports to ${department.parent.name}`
              : 'Top-level department'}
          </p>
        </div>
        <StatusBadge label={`${department._count?.members ?? 0} members`} variant="default" />
      </div>
      {department.description && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">{department.description}</p>
      )}
    </div>
  );
}
