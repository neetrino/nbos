'use client';

import type { ReactNode } from 'react';
import { Building2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import type { DepartmentItem } from '@/lib/api/employees';
import { isEmployeeStatusValue } from '@/features/hr/constants/hr';

export function FoundationMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="border-border bg-card flex min-w-0 flex-1 flex-col rounded-2xl border px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{helper}</p>
    </div>
  );
}

export function CompanyStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="border-border bg-card flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5">
      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-foreground flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">{value}</span>
          <span className="truncate text-sm font-medium">{label}</span>
        </p>
        {helper ? <p className="text-muted-foreground truncate text-xs">{helper}</p> : null}
      </div>
    </div>
  );
}

export function DepartmentFoundationCard({ department }: { department: DepartmentItem }) {
  const t = useTranslations('hr');
  const memberCount = department._count?.members ?? 0;
  const reportsTo = department.parent?.name
    ? t('hub.foundation.reportsTo', { name: department.parent.name })
    : t('hub.foundation.topLevel');
  return (
    <div className="border-border bg-background flex min-w-0 items-center justify-between gap-2 rounded-xl border px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-semibold">{department.name}</p>
        <p className="text-muted-foreground truncate text-xs">{reportsTo}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full">
          <Users size={13} />
        </span>
        <span
          className="text-foreground text-lg leading-none font-semibold tabular-nums"
          aria-label={t('deptAdmin.membersCount', { count: memberCount })}
        >
          {memberCount}
        </span>
      </div>
    </div>
  );
}

export function HubEmployeeStatusBadge({ status }: { status: string }) {
  const t = useTranslations('hr');
  const label = isEmployeeStatusValue(status)
    ? t(`status.${status}` as never)
    : status.replace(/_/g, ' ');
  return <StatusBadge label={label} variant={status === 'ACTIVE' ? 'emerald' : 'amber'} />;
}

export function HubEmptyDepartments() {
  const t = useTranslations('hr');
  return (
    <div className="border-border rounded-xl border border-dashed p-6 text-center">
      <Building2 size={32} className="text-muted-foreground/40 mx-auto" />
      <p className="text-foreground mt-3 text-sm font-medium">{t('hub.foundation.emptyTitle')}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t('hub.foundation.emptyDescription')}</p>
    </div>
  );
}
