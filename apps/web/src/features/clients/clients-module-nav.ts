import { Building2, Users } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const CLIENTS_MODULE_NAV: PageHeroNavLinkItem[] = [
  { href: '/clients/contacts', label: 'Contacts', icon: Users },
  { href: '/clients/companies', label: 'Companies', icon: Building2 },
];
