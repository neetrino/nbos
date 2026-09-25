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
} from '@/features/hr/components/MyCompanyHubCards';
import {
  FoundationGuardrails,
  RecentTeamContext,
} from '@/features/hr/components/MyCompanyHubInsights';
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

type HubLoadedProps = {
  employees: Employee[];
  departments: DepartmentItem[];
  activeEmployees: number;
  assignedEmployees: number;
  rolesCount: number;
  systemRoles: number;
  visibleHubSections: typeof MY_COMPANY_HUB_SECTIONS;
};

function MyCompanyHubLoaded({
  employees,
  departments,
  activeEmployees,
  assignedEmployees,
  rolesCount,
  systemRoles,
  visibleHubSections,
}: HubLoadedProps) {
  return (
    <>
      <HubMetrics
        activeEmployees={activeEmployees}
        departmentCount={departments.length}
        rolesCount={rolesCount}
        systemRoles={systemRoles}
      />
      <HubSectionGrid sections={visibleHubSections} />
      <div className="grid min-w-0 items-stretch gap-4 2xl:grid-cols-[minmax(22rem,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative min-h-0">
          <div className="2xl:absolute 2xl:inset-0">
            <OrgFoundationColumn
              departments={departments}
              assignedEmployees={assignedEmployees}
              employeeCount={employees.length}
            />
          </div>
        </div>
        <div className="grid min-h-0 items-stretch gap-4 sm:grid-cols-2">
          <FoundationGuardrails />
          <RecentTeamContext employees={employees} />
        </div>
      </div>
    </>
  );
}

function HubMetrics({
  activeEmployees,
  departmentCount,
  rolesCount,
  systemRoles,
}: {
  activeEmployees: number;
  departmentCount: number;
  rolesCount: number;
  systemRoles: number;
}) {
  const t = useTranslations('hr');
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <FoundationMetric
        label={t('hub.metrics.activeEmployees')}
        value={activeEmployees}
        helper={t('hub.metrics.activeHelper')}
        icon={<Users2 size={16} />}
      />
      <FoundationMetric
        label={t('hub.metrics.departments')}
        value={departmentCount}
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
  );
}

function OrgFoundationColumn({
  departments,
  assignedEmployees,
  employeeCount,
}: {
  departments: DepartmentItem[];
  assignedEmployees: number;
  employeeCount: number;
}) {
  const t = useTranslations('hr');
  return (
    <div className="border-border bg-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Network size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-sm font-semibold">{t('hub.foundation.title')}</h2>
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {t('hub.foundation.subtitle')}
            </p>
          </div>
        </div>
        <StatusBadge
          label={t('hub.foundation.assigned', {
            assigned: assignedEmployees,
            total: employeeCount,
          })}
          variant={assignedEmployees === employeeCount ? 'emerald' : 'amber'}
          className="shrink-0"
        />
      </div>
      {departments.length === 0 ? (
        <HubEmptyDepartments />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-2">
          {departments.map((department) => (
            <DepartmentFoundationCard key={department.id} department={department} />
          ))}
        </div>
      )}
    </div>
  );
}

function HubSectionGrid({ sections }: { sections: typeof MY_COMPANY_HUB_SECTIONS }) {
  const t = useTranslations('hr');
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Link
            key={section.href}
            href={section.href}
            className="border-border bg-card hover:border-primary/30 hover:bg-muted/30 flex min-h-28 min-w-0 flex-col gap-2 rounded-2xl border p-3 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                <Icon size={14} />
              </div>
              <h3 className="text-foreground truncate text-sm font-semibold">
                {t(`hub.sections.${section.key}.title` as never)}
              </h3>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {t(`hub.sections.${section.key}.description` as never)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
