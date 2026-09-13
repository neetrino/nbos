'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Network } from 'lucide-react';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import {
  DepartmentFoundationCard,
  FoundationMetric,
  HubEmptyDepartments,
  HubEmployeeStatusBadge,
} from '@/features/hr/components/MyCompanyHubCards';
import { MY_COMPANY_HUB_SECTIONS } from '@/features/hr/constants/my-company-hub-sections';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import { usePermission } from '@/lib/permissions';

function getPrimaryDepartment(employee: Employee): string | null {
  const primary = employee.departments.find((membership) => membership.isPrimary);
  return primary?.department.name ?? employee.departments[0]?.department.name ?? null;
}

function countActiveEmployees(employees: Employee[]): number {
  return employees.filter((employee) => employee.status === 'ACTIVE').length;
}

export default function MyCompanyPage() {
  const t = useTranslations('hr');
  const { can, isLoading: permsLoading } = usePermission();
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
      setError(t('hub.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFoundation();
  }, [fetchFoundation]);

  const activeEmployees = countActiveEmployees(employees);
  const assignedEmployees = employees.filter((employee) => employee.departments.length > 0).length;
  const systemRoles = roles.filter((role) => role.isSystem).length;
  const visibleHubSections = MY_COMPANY_HUB_SECTIONS.filter(
    (section) =>
      permsLoading || !section.require || can(section.require.action, section.require.module),
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t('hub.intro')}</p>
      {loading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchFoundation} />
      ) : (
        <MyCompanyHubLoaded
          employees={employees}
          departments={departments}
          activeEmployees={activeEmployees}
          assignedEmployees={assignedEmployees}
          rolesCount={roles.length}
          systemRoles={systemRoles}
          visibleHubSections={visibleHubSections}
        />
      )}
    </div>
  );
}

function MyCompanyHubLoaded({
  employees,
  departments,
  activeEmployees,
  assignedEmployees,
  rolesCount,
  systemRoles,
  visibleHubSections,
}: {
  employees: Employee[];
  departments: DepartmentItem[];
  activeEmployees: number;
  assignedEmployees: number;
  rolesCount: number;
  systemRoles: number;
  visibleHubSections: typeof MY_COMPANY_HUB_SECTIONS;
}) {
  const t = useTranslations('hr');
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <FoundationMetric
          label={t('hub.metrics.activeEmployees')}
          value={activeEmployees}
          helper={t('hub.metrics.activeHelper')}
        />
        <FoundationMetric
          label={t('hub.metrics.departments')}
          value={departments.length}
          helper={t('hub.metrics.departmentsHelper')}
        />
        <FoundationMetric
          label={t('hub.metrics.roles')}
          value={rolesCount}
          helper={t('hub.metrics.rolesHelper', { count: systemRoles })}
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
                  {t('hub.foundation.title')}
                </h2>
                <p className="text-muted-foreground text-sm">{t('hub.foundation.subtitle')}</p>
              </div>
            </div>
            <StatusBadge
              label={t('hub.foundation.assigned', {
                assigned: assignedEmployees,
                total: employees.length,
              })}
              variant={assignedEmployees === employees.length ? 'emerald' : 'amber'}
            />
          </div>
          {departments.length === 0 ? (
            <HubEmptyDepartments />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {departments.map((department) => (
                <DepartmentFoundationCard key={department.id} department={department} />
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3">
          {visibleHubSections.map((section) => {
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
                    <h3 className="text-foreground text-sm font-semibold">
                      {t(`hub.sections.${section.key}.title` as never)}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t(`hub.sections.${section.key}.description` as never)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-foreground text-base font-semibold">{t('hub.guardrails.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('hub.guardrails.subtitle')}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {(['seats', 'compensation', 'orgChart'] as const).map((gap) => (
            <div key={gap} className="bg-muted/40 rounded-xl p-4">
              <p className="text-muted-foreground text-sm">{t(`hub.guardrails.${gap}` as never)}</p>
            </div>
          ))}
        </div>
      </div>
      <RecentTeamContext employees={employees} />
    </>
  );
}

function RecentTeamContext({ employees }: { employees: Employee[] }) {
  const t = useTranslations('hr');
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-foreground text-base font-semibold">{t('hub.recent.title')}</h2>
      {employees.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">{t('hub.recent.empty')}</p>
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
                    {employee.role.name} ·{' '}
                    {getPrimaryDepartment(employee) ?? t('hub.recent.noDepartment')}
                  </p>
                </div>
                <HubEmployeeStatusBadge status={employee.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
