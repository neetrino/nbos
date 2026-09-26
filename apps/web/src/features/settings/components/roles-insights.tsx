'use client';

import type { ReactNode } from 'react';
import { Info, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoleListItem } from './role-permissions-types';

export function RolesInsights({ roles }: { roles: RoleListItem[] }) {
  const active = roles.filter((role) => !role.archivedAt).length;
  const system = roles.filter((role) => role.isSystem).length;
  const custom = roles.filter((role) => !role.isSystem).length;
  const people = roles.reduce((sum, role) => sum + (role._count?.employees ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
        <div className="bg-primary/15 pointer-events-none absolute -top-10 -left-8 size-24 rounded-full blur-2xl" />
        <InsightHeading icon={<Shield size={15} />} title="Access" />
        <div className="relative mt-3 grid grid-cols-2 gap-2">
          <InsightStat label="Active" value={active} />
          <InsightStat label="System" value={system} />
          <InsightStat label="Custom" value={custom} />
          <InsightStat label="People" value={people} />
        </div>
      </section>
      <LevelSpread roles={roles} />
      <RoleGuide />
    </div>
  );
}

function RoleGuide() {
  const steps = [
    'Open a role to set what that person can view, add, edit, and delete.',
    'System roles stay in place. A custom role can be archived when it is no longer used.',
    'L1 is the top of the company. A higher level number sits further down the list.',
  ];

  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -bottom-10 -left-8 size-24 rounded-full blur-2xl" />
      <InsightHeading icon={<Info size={15} />} title="How roles work" />
      <ol className="relative mt-3 flex flex-col gap-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5">
            <span className="text-primary w-6 shrink-0 text-xs font-semibold tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="text-muted-foreground text-sm leading-snug">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InsightHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="relative flex items-center gap-2.5">
      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
    </div>
  );
}

function InsightStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/40 rounded-xl px-3 py-2.5">
      <p className="text-foreground text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function LevelSpread({ roles }: { roles: RoleListItem[] }) {
  const levels = levelCounts(roles);
  const widest = Math.max(...levels.map((row) => row.count), 1);

  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -right-8 -bottom-10 size-24 rounded-full blur-2xl" />
      <InsightHeading icon={<Users size={15} />} title="By level" />
      <ul className="relative mt-3 flex flex-col gap-1.5">
        {levels.map((row) => (
          <li key={row.level} className="grid grid-cols-[2.5rem_1fr_1.5rem] items-center gap-2">
            <span className="text-foreground text-sm font-semibold tabular-nums">L{row.level}</span>
            <span className="bg-muted h-1.5 overflow-hidden rounded-full">
              <span
                className={cn('bg-primary block h-full rounded-full', barWidth(row.count, widest))}
              />
            </span>
            <span className="text-muted-foreground text-right text-sm tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function levelCounts(roles: RoleListItem[]): { level: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const role of roles) {
    counts.set(role.level, (counts.get(role.level) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, count]) => ({ level, count }));
}

function barWidth(count: number, widest: number): string {
  const ratio = count / widest;
  if (ratio > 0.66) return 'w-full';
  if (ratio > 0.33) return 'w-2/3';
  return 'w-1/3';
}
