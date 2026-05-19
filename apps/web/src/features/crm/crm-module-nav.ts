import { BarChart3, Handshake, Megaphone } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const CRM_MODULE_NAV: PageHeroNavLinkItem[] = [
  { href: '/crm/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/crm/leads', label: 'Leads', icon: Megaphone },
  { href: '/crm/deals', label: 'Deals', icon: Handshake },
];
