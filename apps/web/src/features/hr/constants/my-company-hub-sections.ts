import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  ListChecks,
  Percent,
  ShieldCheck,
  Target,
  Users2,
} from 'lucide-react';

export type MyCompanyHubSectionKey =
  | 'team'
  | 'departments'
  | 'rolesSeats'
  | 'compensation'
  | 'bonus'
  | 'kpi'
  | 'sop'
  | 'checklists';

export type MyCompanyHubSection = {
  key: MyCompanyHubSectionKey;
  href: string;
  icon: LucideIcon;
  require?: { module: string; action: string };
};

export const MY_COMPANY_HUB_SECTIONS: MyCompanyHubSection[] = [
  { key: 'team', href: '/my-company/team', icon: Users2 },
  { key: 'departments', href: '/my-company/departments', icon: Building2 },
  { key: 'rolesSeats', href: '/my-company/roles-seats', icon: ShieldCheck },
  {
    key: 'compensation',
    href: '/my-company/compensation',
    icon: BadgeDollarSign,
    require: { module: 'FINANCE_SALARY', action: 'VIEW' },
  },
  {
    key: 'bonus',
    href: '/my-company/bonus-policies',
    icon: Percent,
    require: { module: 'COMPANY', action: 'VIEW' },
  },
  {
    key: 'kpi',
    href: '/my-company/kpi',
    icon: Target,
    require: { module: 'COMPANY', action: 'VIEW' },
  },
  { key: 'sop', href: '/my-company/sop', icon: ClipboardList },
  {
    key: 'checklists',
    href: '/my-company/checklist-templates',
    icon: ListChecks,
    require: { module: 'CHECKLIST_TEMPLATES', action: 'VIEW' },
  },
];
