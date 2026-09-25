'use client';

import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
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
    <div className="border-border bg-card flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 sm:max-w-sm sm:flex-1">
      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-foreground flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">{value}</span>
          <span className="truncate text-sm font-medium">{label}</span>
        </p>
        <p className="text-muted-foreground truncate text-xs">{helper}</p>
      </div>
    </div>
  );
}

export function DepartmentFoundationCard({ department }: { department: DepartmentItem }) {
  const t = useTranslations('hr');
  const memberCount = department._count?.members ?? 0;
  return (
    <div className="border-border flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{department.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {department.parent?.name
            ? t('hub.foundation.reportsTo', { name: department.parent.name })
            : t('hub.foundation.topLevel')}
        </p>
      </div>
      <StatusBadge
        label={t('deptAdmin.membersCount', { count: memberCount })}
        variant="default"
        className="shrink-0"
      />
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
