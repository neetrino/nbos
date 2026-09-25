import {
  BadgeDollarSign,
  ListChecks,
  Percent,
  Target,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

export type CompanySectionGroup = 'bonus' | 'kpi' | 'checklists';

export type CompanySectionTab = {
  href: string;
  labelKey:
    | 'companyNav.bonusPolicies'
    | 'companyNav.salesBonus'
    | 'companyNav.kpiScorecard'
    | 'companyNav.kpiGate'
    | 'companyNav.checklistTemplates'
    | 'companyNav.checklistRules';
  icon: LucideIcon;
};

export const COMPANY_SECTION_TABS: Record<CompanySectionGroup, readonly CompanySectionTab[]> = {
  bonus: [
    {
      href: '/my-company/bonus-policies',
      labelKey: 'companyNav.bonusPolicies',
      icon: BadgeDollarSign,
    },
    {
      href: '/my-company/sales-bonus-policies',
      labelKey: 'companyNav.salesBonus',
      icon: Percent,
    },
  ],
  kpi: [
    { href: '/my-company/kpi', labelKey: 'companyNav.kpiScorecard', icon: Target },
    { href: '/my-company/kpi-policies', labelKey: 'companyNav.kpiGate', icon: Target },
  ],
  checklists: [
    {
      href: '/my-company/checklist-templates',
      labelKey: 'companyNav.checklistTemplates',
      icon: ListChecks,
    },
    {
      href: '/my-company/checklist-stage-rules',
      labelKey: 'companyNav.checklistRules',
      icon: Waypoints,
    },
  ],
};

export function companySectionFromPath(pathname: string): string {
  for (const tabs of Object.values(COMPANY_SECTION_TABS)) {
    const match = tabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
    if (match) return match.href;
  }
  return '';
}
