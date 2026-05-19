import { BarChart3, LayoutGrid, Settings, Split } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const MARKETING_MODULE_NAV: PageHeroNavLinkItem[] = [
  { href: '/marketing', label: 'Board', icon: LayoutGrid, exactMatch: true },
  {
    href: '/marketing/attribution',
    label: 'Attribution',
    icon: Split,
  },
  { href: '/marketing/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/marketing/settings', label: 'Settings', icon: Settings },
];
