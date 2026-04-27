'use client';

import Link from 'next/link';
import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  Network,
  ShieldCheck,
  Target,
  Users2,
} from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/shared';

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

export default function MyCompanyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Company"
        description="Org Structure is the company control center for departments, seats, employees, KPI, compensation, and SOP."
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">Org Structure</h2>
              <p className="text-muted-foreground text-sm">
                The full org chart canvas is planned for this module.
              </p>
            </div>
          </div>
          <EmptyState
            icon={Network}
            title="Org chart canvas is not configured yet"
            description="Departments and Team are available now. Seats, vacancies, KPI and compensation will be connected here as the My Company model matures."
          />
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
    </div>
  );
}
