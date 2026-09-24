import type { CatalogSeedItem } from './catalog-seed-types';

/** Аналитика и отчёты внутри продукта. Внешние системы аналитики — в категории интеграций. */
export const ANALYTICS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'ANL_DASHBOARD',
    category: 'analytics',
    iconKey: 'BarChart3',
    title: 'Metrics dashboard',
    summary: 'A main-screen summary of key metrics.',
    scopeBoundaries: 'Agreed metric set, comparison periods, charts, and data-view permissions.',
    units: { BACKEND: 20, FRONTEND: 16, PM: 3, DESIGNER: 5, QA: 5 },
  },
  {
    code: 'ANL_CUSTOM_REPORTS',
    category: 'analytics',
    iconKey: 'FileSpreadsheet',
    title: 'Custom reports',
    summary: 'Reports based on agreed metrics and dimensions.',
    scopeBoundaries:
      'Report list, filters and dimensions, export, and calculation validation against real data.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 6 },
  },
  {
    code: 'ANL_REPORT_BUILDER',
    category: 'analytics',
    iconKey: 'Table',
    title: 'Report builder',
    summary: 'Users assemble reports from available fields.',
    scopeBoundaries:
      'Available fields and aggregates, filters and grouping, saved reports, and expensive-query limits.',
    units: { BACKEND: 34, FRONTEND: 26, PM: 5, DESIGNER: 5, QA: 9 },
  },
  {
    code: 'ANL_SCHEDULED_REPORTS',
    category: 'analytics',
    iconKey: 'Clock',
    title: 'Scheduled reports',
    summary: 'Automatic report delivery to recipients.',
    scopeBoundaries: 'Schedule, recipients, file format, delivery channel, and delivery log.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, QA: 4 },
  },
  {
    code: 'ANL_EXPORT_EXCEL',
    category: 'analytics',
    iconKey: 'Download',
    title: 'Excel and CSV data export',
    summary: 'Export of lists and reports to files.',
    scopeBoundaries:
      'Agreed sections, column set, export volume and background generation, encoding, and date formats.',
    units: { BACKEND: 12, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'ANL_BI_EXPORT',
    category: 'analytics',
    iconKey: 'LineChart',
    title: 'BI system export',
    summary: 'A data feed to an external BI system or warehouse.',
    scopeBoundaries:
      'One export destination, contents and cadence, incremental delivery, access, and monitoring.',
    units: { BACKEND: 24, FRONTEND: 4, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'ANL_FUNNEL_ANALYSIS',
    category: 'analytics',
    iconKey: 'PieChart',
    title: 'Funnel analysis',
    summary: 'Conversion across process steps.',
    scopeBoundaries:
      'Step definition, conversion and drop-off calculation, period comparison, and source dimensions.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'ANL_ACTIVITY_MONITOR',
    category: 'analytics',
    iconKey: 'Gauge',
    title: 'User activity monitoring',
    summary: 'Visibility into who uses the system and how actively.',
    scopeBoundaries:
      'Activity metrics, user and department reports, period selection, and viewing permissions.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 2, QA: 4 },
  },
] as const;
