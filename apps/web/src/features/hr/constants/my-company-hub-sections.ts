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
  Waypoints,
} from 'lucide-react';

export type MyCompanyHubSectionKey =
  | 'team'
  | 'departments'
  | 'rolesSeats'
  | 'compensation'
  | 'bonusPolicies'
  | 'salesBonus'
  | 'kpi'
  | 'kpiGate'
  | 'sop'
  | 'checklists'
  | 'checklistRules';

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
  { key: 'compensation', href: '/my-company/compensation', icon: BadgeDollarSign },
  {
    key: 'bonusPolicies',
    href: '/my-company/bonus-policies',
    icon: BadgeDollarSign,
    require: { module: 'COMPANY', action: 'VIEW' },
  },
  { key: 'salesBonus', href: '/my-company/sales-bonus-policies', icon: Percent },
  { key: 'kpi', href: '/my-company/kpi', icon: Target },
  {
    key: 'kpiGate',
    href: '/my-company/kpi-policies',
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
  {
    key: 'checklistRules',
    href: '/my-company/checklist-stage-rules',
    icon: Waypoints,
    require: { module: 'CHECKLIST_TEMPLATES', action: 'VIEW' },
  },
];
