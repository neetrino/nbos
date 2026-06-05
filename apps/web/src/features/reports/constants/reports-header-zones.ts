import type { ReportsSectionId } from '@/lib/navigation/module-last-visit/reports-visit-config';

export type ReportsHeaderZoneDefinition = {
  zone: ReportsSectionId;
  label: string;
};

/** Header zones for anyone who can open `/reports` (API gates report data). */
export const REPORTS_HEADER_ZONES: ReportsHeaderZoneDefinition[] = [
  { zone: 'finance', label: 'Finance' },
  { zone: 'growth', label: 'Growth' },
  { zone: 'delivery', label: 'Delivery' },
  { zone: 'center', label: 'Report center' },
];
