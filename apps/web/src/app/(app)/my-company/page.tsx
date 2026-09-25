'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Building2, Network, ShieldCheck, Users2 } from 'lucide-react';
import {
  DataView,
  ErrorState,
  ListMutationErrorBanner,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
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
  const hasData = employees.length > 0 || departments.length > 0 || roles.length > 0;
  const hub = (
    <MyCompanyHubLoaded
      employees={employees}
      departments={departments}
      activeEmployees={activeEmployees}
      assignedEmployees={assignedEmployees}
      rolesCount={roles.length}
      systemRoles={systemRoles}
      visibleHubSections={visibleHubSections}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t('hub.intro')}</p>
      {error && hasData ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasData}
        loadingFallback={<LoadingState variant="cards" count={6} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={fetchFoundation} />}
        emptyFallback={hub}
      >
        {hub}
      </DataView>
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <FoundationMetric
          label={t('hub.metrics.activeEmployees')}
          value={activeEmployees}
          helper={t('hub.metrics.activeHelper')}
          icon={<Users2 size={16} />}
        />
        <FoundationMetric
          label={t('hub.metrics.departments')}
          value={departments.length}
          helper={t('hub.metrics.departmentsHelper')}
          icon={<Building2 size={16} />}
        />
        <FoundationMetric
          label={t('hub.metrics.roles')}
          value={rolesCount}
          helper={t('hub.metrics.rolesHelper', { count: systemRoles })}
          icon={<ShieldCheck size={16} />}
        />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleHubSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="border-border bg-card hover:border-primary/30 hover:bg-muted/30 block rounded-2xl border px-4 py-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-foreground text-sm font-semibold">
                      {t(`hub.sections.${section.key}.title` as never)}
                    </h3>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {t(`hub.sections.${section.key}.description` as never)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Network size={15} />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground text-sm font-semibold">
                  {t('hub.foundation.title')}
                </h2>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {t('hub.foundation.subtitle')}
                </p>
              </div>
            </div>
            <StatusBadge
              label={t('hub.foundation.assigned', {
                assigned: assignedEmployees,
                total: employees.length,
              })}
              variant={assignedEmployees === employees.length ? 'emerald' : 'amber'}
              className="shrink-0"
            />
          </div>
          {departments.length === 0 ? (
            <HubEmptyDepartments />
          ) : (
            <div className="flex flex-col gap-2">
              {departments.map((department) => (
                <DepartmentFoundationCard key={department.id} department={department} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">{t('hub.guardrails.title')}</h2>
          <p className="text-muted-foreground mt-1 text-xs">{t('hub.guardrails.subtitle')}</p>
          <div className="mt-3 flex flex-col gap-2">
            {(['seats', 'compensation', 'orgChart'] as const).map((gap) => (
              <p
                key={gap}
                className="border-border text-muted-foreground rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
              >
                {t(`hub.guardrails.${gap}` as never)}
              </p>
            ))}
          </div>
        </div>
        <RecentTeamContext employees={employees} />
      </div>
    </>
  );
}

function RecentTeamContext({ employees }: { employees: Employee[] }) {
  const t = useTranslations('hr');
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">{t('hub.recent.title')}</h2>
      {employees.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">{t('hub.recent.empty')}</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {employees.slice(0, 6).map((employee) => (
            <div
              key={employee.id}
              className="border-border flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {employee.role.name} ·{' '}
                  {getPrimaryDepartment(employee) ?? t('hub.recent.noDepartment')}
                </p>
              </div>
              <HubEmployeeStatusBadge status={employee.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
