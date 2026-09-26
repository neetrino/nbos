import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  Layers,
  ListChecks,
  Network,
  Percent,
  ShieldCheck,
  Target,
  Users2,
  type LucideIcon,
} from 'lucide-react';
import { DELIVERY_COMPENSATION_RULES_MODULE, FUNCTION_CATALOG_MODULE } from '@nbos/shared';

export type MyCompanyNavLabelKey =
  | 'companyNav.orgStructure'
  | 'companyNav.team'
  | 'companyNav.departments'
  | 'companyNav.rolesSeats'
  | 'companyNav.salaries'
  | 'companyNav.bonus'
  | 'companyNav.kpi'
  | 'companyNav.checklists'
  | 'companyNav.sop'
  | 'companyNav.coreFunction';

export type MyCompanyHubDescriptionKey =
  | 'hub.sections.team.description'
  | 'hub.sections.departments.description'
  | 'hub.sections.rolesSeats.description'
  | 'hub.sections.compensation.description'
  | 'hub.sections.bonus.description'
  | 'hub.sections.kpi.description'
  | 'hub.sections.checklists.description'
  | 'hub.sections.sop.description'
  | 'hub.sections.coreFunction.description';

export type MyCompanyNavGate = 'company' | 'salary' | 'checklists' | 'coreFunction';

export type MyCompanyNavItem = {
  href: string;
  labelKey: MyCompanyNavLabelKey;
  icon: LucideIcon;
  gate: MyCompanyNavGate;
  exactMatch?: boolean;
  matchHrefs?: readonly string[];
  descriptionKey?: MyCompanyHubDescriptionKey;
};

/** Hero tabs and org-structure cards share this order and these labels. */
export const MY_COMPANY_NAV: MyCompanyNavItem[] = [
  {
    href: '/my-company',
    labelKey: 'companyNav.orgStructure',
    icon: Network,
    gate: 'company',
    exactMatch: true,
  },
  {
    href: '/my-company/team',
    labelKey: 'companyNav.team',
    icon: Users2,
    gate: 'company',
    descriptionKey: 'hub.sections.team.description',
  },
  {
    href: '/my-company/departments',
    labelKey: 'companyNav.departments',
    icon: Building2,
    gate: 'company',
    descriptionKey: 'hub.sections.departments.description',
  },
  {
    href: '/my-company/roles-seats',
    labelKey: 'companyNav.rolesSeats',
    icon: ShieldCheck,
    gate: 'company',
    descriptionKey: 'hub.sections.rolesSeats.description',
  },
  {
    href: '/my-company/compensation',
    labelKey: 'companyNav.salaries',
    icon: BadgeDollarSign,
    gate: 'salary',
    descriptionKey: 'hub.sections.compensation.description',
  },
  {
    href: '/my-company/bonus-policies',
    labelKey: 'companyNav.bonus',
    icon: Percent,
    gate: 'company',
    matchHrefs: ['/my-company/bonus-policies', '/my-company/sales-bonus-policies'],
    descriptionKey: 'hub.sections.bonus.description',
  },
  {
    href: '/my-company/kpi',
    labelKey: 'companyNav.kpi',
    icon: Target,
    gate: 'company',
    matchHrefs: ['/my-company/kpi', '/my-company/kpi-policies'],
    descriptionKey: 'hub.sections.kpi.description',
  },
  {
    href: '/my-company/checklist-templates',
    labelKey: 'companyNav.checklists',
    icon: ListChecks,
    gate: 'checklists',
    matchHrefs: ['/my-company/checklist-templates', '/my-company/checklist-stage-rules'],
    descriptionKey: 'hub.sections.checklists.description',
  },
  {
    href: '/my-company/sop',
    labelKey: 'companyNav.sop',
    icon: ClipboardList,
    gate: 'company',
    descriptionKey: 'hub.sections.sop.description',
  },
  {
    href: '/my-company/delivery-norms',
    labelKey: 'companyNav.coreFunction',
    icon: Layers,
    gate: 'coreFunction',
    exactMatch: true,
    descriptionKey: 'hub.sections.coreFunction.description',
  },
];

export type MyCompanyHubSection = MyCompanyNavItem & {
  descriptionKey: MyCompanyHubDescriptionKey;
};

export function myCompanyHubSections(): MyCompanyHubSection[] {
  return MY_COMPANY_NAV.filter(
    (item): item is MyCompanyHubSection => item.descriptionKey !== undefined,
  );
}

type CanPermission = (action: string, module: string) => boolean;

/** Same gates as the My Company hero tabs. */
export function isMyCompanyNavVisible(gate: MyCompanyNavGate, can: CanPermission): boolean {
  if (gate === 'checklists') return can('VIEW', 'CHECKLIST_TEMPLATES');
  if (gate === 'coreFunction') {
    return can('VIEW', FUNCTION_CATALOG_MODULE) || can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  }
  const canOpenHr = can('VIEW', 'COMPANY');
  if (gate === 'salary') return canOpenHr && can('VIEW', 'FINANCE_SALARY');
  return canOpenHr;
}
