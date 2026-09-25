'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import type { ActiveCompensationSummary } from '@/lib/api/compensation-profiles';
import type { Employee } from '@/lib/api/employees';

const CARD_CLASS = [
  'bg-card focus-visible:ring-ring group flex w-full flex-col items-center rounded-3xl p-5 text-center',
  'shadow-[0_12px_40px_rgb(15_15_20/0.08)] transition-[transform,box-shadow]',
  'hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgb(15_15_20/0.11)]',
  'focus-visible:ring-2 focus-visible:outline-none',
].join(' ');

export function SalaryEmployeeCard({
  employee,
  summary,
  onOpen,
}: {
  employee: Employee;
  summary: ActiveCompensationSummary | undefined;
  onOpen: (employee: Employee) => void;
}) {
  const t = useTranslations('hr.salaries');
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  const salary = summary?.baseSalary ?? employee.baseSalary;
  const hasSalary = salary != null && salary !== '' && salary !== '0' && salary !== '0.00';

  return (
    <button type="button" onClick={() => onOpen(employee)} className={CARD_CLASS}>
      <EmployeePersonAvatar label={name} imageUrl={employee.avatar} className="size-16 text-lg" />
      <StatusBadge
        label={hasSalary ? t('set') : t('missing')}
        variant={hasSalary ? 'green' : 'amber'}
        dot
        className="mt-3 self-center rounded-full px-2.5 py-0.5 text-xs"
      />
      <h3 className="text-foreground mt-3 max-w-full truncate text-base font-bold tracking-tight">
        {name}
      </h3>
      <p className="text-muted-foreground mt-1 max-w-full truncate text-sm">
        {employee.position || employee.role.name}
      </p>
      <div className="border-border mt-5 w-full space-y-1 border-t pt-4 text-left text-sm">
        <p className="text-foreground tabular-nums">
          {hasSalary ? `${salary} ${summary?.currency ?? 'AMD'}` : t('notSet')}
        </p>
        <p className="text-muted-foreground truncate">
          {summary?.bonusPolicyName ?? t('bonusOff')}
        </p>
        <p className="text-muted-foreground truncate">{summary?.kpiPolicyName ?? t('kpiOff')}</p>
      </div>
    </button>
  );
}
