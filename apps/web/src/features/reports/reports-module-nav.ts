import {
  CalendarClock,
  Download,
  FileChartColumn,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';
import { resolveReportsSectionId } from '@/lib/navigation/module-last-visit/reports-visit-config';

export const REPORTS_FINANCE_NAV: PageHeroNavLinkItem[] = [
  {
    href: '/reports/finance',
    label: 'Overview',
    icon: LayoutDashboard,
    exactMatch: true,
  },
];

export const REPORTS_GROWTH_NAV: PageHeroNavLinkItem[] = [
  { href: '/reports/growth/sales', label: 'Sales', icon: TrendingUp },
  { href: '/reports/growth/marketing', label: 'Marketing', icon: Megaphone },
];

export const REPORTS_DELIVERY_NAV: PageHeroNavLinkItem[] = [
  { href: '/reports/delivery/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reports/delivery/specialists', label: 'Specialists', icon: Users },
];

export const REPORTS_CENTER_NAV: PageHeroNavLinkItem[] = [
  { href: '/reports/center/scheduled', label: 'Scheduled', icon: CalendarClock },
  { href: '/reports/center/exports', label: 'Exports', icon: Download },
  { href: '/reports/center/quality', label: 'Data quality', icon: ShieldAlert },
];

/** Zone tabs for the current Reports route; `null` = no section pills. */
export function resolveReportsZoneNav(pathname: string): PageHeroNavLinkItem[] | null {
  const nav = resolveReportsZoneNavItems(pathname);
  if (!nav || nav.length <= 1) {
    return null;
  }
  return nav;
}

function resolveReportsZoneNavItems(pathname: string): PageHeroNavLinkItem[] | null {
  const zone = resolveReportsSectionId(pathname);
  switch (zone) {
    case 'finance':
      return REPORTS_FINANCE_NAV;
    case 'growth':
      return REPORTS_GROWTH_NAV;
    case 'delivery':
      return REPORTS_DELIVERY_NAV;
    case 'center':
      return REPORTS_CENTER_NAV;
    default:
      return null;
  }
}

/** Icon for finance zone when only one sub-tab (header context). */
export const REPORTS_FINANCE_ZONE_ICON = FileChartColumn;
