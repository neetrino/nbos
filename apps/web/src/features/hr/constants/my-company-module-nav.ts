import { Building2, Network, ShieldCheck, Users2 } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const MY_COMPANY_MODULE_NAV: PageHeroNavLinkItem[] = [
  { href: '/my-company', label: 'Org Structure', icon: Network },
  { href: '/my-company/team', label: 'Team', icon: Users2 },
  { href: '/my-company/departments', label: 'Departments', icon: Building2 },
  { href: '/my-company/roles-seats', label: 'Roles & Seats', icon: ShieldCheck },
];
