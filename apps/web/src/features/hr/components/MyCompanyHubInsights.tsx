'use client';

import type { LucideIcon } from 'lucide-react';
import { BadgeDollarSign, Network, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HubEmployeeStatusBadge } from '@/features/hr/components/MyCompanyHubCards';
import type { Employee } from '@/lib/api/employees';

const GUARDRAIL_ITEMS: readonly { key: 'seats' | 'compensation' | 'orgChart'; icon: LucideIcon }[] =
  [
    { key: 'seats', icon: ShieldCheck },
    { key: 'compensation', icon: BadgeDollarSign },
    { key: 'orgChart', icon: Network },
  ];

const RECENT_TEAM_LIMIT = 6;

function primaryDepartment(employee: Employee): string | null {
  const primary = employee.departments.find((membership) => membership.isPrimary);
  return primary?.department.name ?? employee.departments[0]?.department.name ?? null;
}

function employeeInitials(employee: Employee): string {
  return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
}

export function FoundationGuardrails() {
  const t = useTranslations('hr');
  return (
    <section className="border-border bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/20 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-start gap-2.5">
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Sparkles size={15} />
        </div>
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">{t('hub.guardrails.title')}</h2>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
            {t('hub.guardrails.subtitle')}
          </p>
        </div>
      </div>
      <ol className="relative mt-3 flex flex-1 flex-col gap-2">
        {GUARDRAIL_ITEMS.map((item, index) => (
          <GuardrailStep key={item.key} itemKey={item.key} icon={item.icon} index={index} />
        ))}
      </ol>
    </section>
  );
}

function GuardrailStep({
  itemKey,
  icon: Icon,
  index,
}: {
  itemKey: (typeof GUARDRAIL_ITEMS)[number]['key'];
  icon: LucideIcon;
  index: number;
}) {
  const t = useTranslations('hr');
  const step = String(index + 1).padStart(2, '0');
  return (
    <li className="bg-muted/50 flex flex-1 items-start gap-2.5 rounded-xl px-3 py-2.5">
      <span className="text-primary pt-0.5 text-xs font-semibold tabular-nums">{step}</span>
      <span className="bg-card text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md">
        <Icon size={13} />
      </span>
      <p className="text-foreground/80 text-xs leading-relaxed">
        {t(`hub.guardrails.${itemKey}` as never)}
      </p>
    </li>
  );
}

export function RecentTeamContext({ employees }: { employees: Employee[] }) {
  const t = useTranslations('hr');
  const recent = employees.slice(0, RECENT_TEAM_LIMIT);
  return (
    <section className="border-border bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -bottom-10 -left-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Users2 size={15} />
          </div>
          <h2 className="text-foreground truncate text-sm font-semibold">
            {t('hub.recent.title')}
          </h2>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {recent.length}
        </span>
      </div>
      {recent.length === 0 ? (
        <p className="text-muted-foreground relative mt-3 text-xs">{t('hub.recent.empty')}</p>
      ) : (
        <ul className="relative mt-3 flex flex-col gap-1">
          {recent.map((employee) => (
            <RecentTeamRow key={employee.id} employee={employee} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentTeamRow({ employee }: { employee: Employee }) {
  const t = useTranslations('hr');
  const department = primaryDepartment(employee) ?? t('hub.recent.noDepartment');
  return (
    <li className="hover:bg-muted/60 flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {employeeInitials(employee)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">
          {employee.firstName} {employee.lastName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {employee.role.name} · {department}
        </p>
      </div>
      <HubEmployeeStatusBadge status={employee.status} />
    </li>
  );
}
