'use client';

import {
  CalendarClock,
  Download,
  FileChartColumn,
  FolderKanban,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PageHeroTabs, type PageHeroTabOption } from '@/components/shared/page-hero';
import type { ReportCategory } from '@/lib/api/reports';

export type ReportsView =
  | Extract<ReportCategory, 'FINANCE' | 'SALES' | 'MARKETING' | 'PROJECTS' | 'SPECIALISTS'>
  | 'SCHEDULED'
  | 'EXPORTS'
  | 'QUALITY';

export const REPORT_VIEW_TAB_OPTIONS: PageHeroTabOption<ReportsView>[] = [
  { value: 'FINANCE', label: 'Finance', icon: FileChartColumn },
  { value: 'SALES', label: 'Sales', icon: TrendingUp },
  { value: 'MARKETING', label: 'Marketing', icon: Megaphone },
  { value: 'PROJECTS', label: 'Projects', icon: FolderKanban },
  { value: 'SPECIALISTS', label: 'Specialists', icon: Users },
  { value: 'SCHEDULED', label: 'Scheduled', icon: CalendarClock },
  { value: 'EXPORTS', label: 'Exports', icon: Download },
  { value: 'QUALITY', label: 'Data quality', icon: ShieldAlert },
];

export function ReportsViewTabs({
  view,
  onViewChange,
}: {
  view: ReportsView;
  onViewChange: (view: ReportsView) => void;
}) {
  return (
    <PageHeroTabs
      value={view}
      onChange={onViewChange}
      options={REPORT_VIEW_TAB_OPTIONS}
      ariaLabel="Reports sections"
    />
  );
}

export function reportViewLabel(view: ReportsView): string {
  return REPORT_VIEW_TAB_OPTIONS.find((item) => item.value === view)?.label ?? 'Reports';
}
