'use client';

import type { ReportsViewId } from '@/features/reports/reports-routing';

/** @deprecated Use ReportsViewId from reports-routing */
export type ReportsView = ReportsViewId;

export function reportViewLabel(view: ReportsViewId): string {
  const labels: Record<ReportsViewId, string> = {
    FINANCE: 'Finance',
    SALES: 'Sales',
    MARKETING: 'Marketing',
    PROJECTS: 'Projects',
    SPECIALISTS: 'Specialists',
    SCHEDULED: 'Scheduled',
    EXPORTS: 'Exports',
    QUALITY: 'Data quality',
  };
  return labels[view] ?? 'Reports';
}
