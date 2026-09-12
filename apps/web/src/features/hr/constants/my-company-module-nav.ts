import { Building2, Network, ShieldCheck, Users2, type LucideIcon } from 'lucide-react';

export type MyCompanyNavLabelKey =
  | 'companyNav.orgStructure'
  | 'companyNav.team'
  | 'companyNav.departments'
  | 'companyNav.rolesSeats';

export type MyCompanyModuleNavItem = {
  href: string;
  labelKey: MyCompanyNavLabelKey;
  icon: LucideIcon;
  exactMatch?: boolean;
};

export const MY_COMPANY_MODULE_NAV: MyCompanyModuleNavItem[] = [
  { href: '/my-company', labelKey: 'companyNav.orgStructure', icon: Network, exactMatch: true },
  { href: '/my-company/team', labelKey: 'companyNav.team', icon: Users2 },
  { href: '/my-company/departments', labelKey: 'companyNav.departments', icon: Building2 },
  { href: '/my-company/roles-seats', labelKey: 'companyNav.rolesSeats', icon: ShieldCheck },
];
