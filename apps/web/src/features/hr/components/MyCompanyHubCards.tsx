'use client';

import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import type { DepartmentItem } from '@/lib/api/employees';
import { isEmployeeStatusValue } from '@/features/hr/constants/hr';

export function FoundationMetric({
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

export function DepartmentFoundationCard({ department }: { department: DepartmentItem }) {
  const t = useTranslations('hr');
  const memberCount = department._count?.members ?? 0;
  return (
    <div className="border-border rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-foreground text-sm font-medium">{department.name}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {department.parent?.name
              ? t('hub.foundation.reportsTo', { name: department.parent.name })
              : t('hub.foundation.topLevel')}
          </p>
        </div>
        <StatusBadge
          label={t('deptAdmin.membersCount', { count: memberCount })}
          variant="default"
        />
      </div>
      {department.description ? (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">{department.description}</p>
      ) : null}
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
