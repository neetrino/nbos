import { FINANCE_REPORT_DEFINITIONS } from '../finance/reports/finance-report-definitions';
import type { ReportDefinition } from './reports.types';

const STANDARD_FILTERS = ['dateFrom', 'dateTo', 'asOf'];
const STANDARD_EXPORTS = ['CSV', 'XLSX', 'PDF'] as const;
const FINANCE_PERMISSION = [{ module: 'FINANCE_INVOICES', action: 'VIEW' }];

const CROSS_MODULE_REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    key: 'sales-pipeline-health',
    title: 'Sales Pipeline Health',
    category: 'SALES',
    ownerModule: 'CRM',
    description: 'Pipeline and won deals.',
    audience: ['CEO', 'Head of Sales', 'Seller'],
    supportedFilters: [...STANDARD_FILTERS, 'seller', 'source'],
    supportedExports: [...STANDARD_EXPORTS],
    visualizations: ['kpi_cards', 'funnel_bars', 'source_distribution'],
    sourceEndpoints: ['/api/crm/leads/stats', '/api/crm/deals/stats'],
    drillDownHrefs: ['/crm/leads', '/crm/deals'],
    requiredPermissions: [{ module: 'CRM_DEALS', action: 'VIEW' }],
    status: 'READY',
    dataQualityNotes: ['Period-scoped deep sales aggregates can be expanded after CRM stats v2.'],
  },
  {
    key: 'marketing-source-performance',
    title: 'Marketing Source Performance',
    category: 'MARKETING',
    ownerModule: 'MARKETING',
    description: 'Spend, ROAS, attribution.',
    audience: ['CEO', 'Head of Marketing', 'Marketing'],
    supportedFilters: [...STANDARD_FILTERS, 'channel', 'account'],
    supportedExports: [...STANDARD_EXPORTS],
    visualizations: ['kpi_cards', 'efficiency_table', 'data_quality'],
    sourceEndpoints: ['/api/marketing/dashboard'],
    drillDownHrefs: ['/marketing/dashboard', '/marketing/attribution'],
    requiredPermissions: [{ module: 'CRM_LEADS', action: 'VIEW' }],
    status: 'READY',
    dataQualityNotes: ['ROI is hidden when linked spend or paid attribution is incomplete.'],
  },
  {
    key: 'project-delivery-overview',
    title: 'Project Delivery Overview',
    category: 'PROJECTS',
    ownerModule: 'PROJECTS',
    description: 'Delivery status.',
    audience: ['CEO', 'Head of Delivery', 'PM'],
    supportedFilters: [...STANDARD_FILTERS, 'project', 'pm'],
    supportedExports: [...STANDARD_EXPORTS],
    visualizations: ['kpi_cards', 'status_bars', 'risk_table'],
    sourceEndpoints: ['/api/projects/products/stats', '/api/projects/extensions/stats'],
    drillDownHrefs: ['/projects'],
    requiredPermissions: [{ module: 'PROJECTS', action: 'VIEW' }],
    status: 'READY',
    dataQualityNotes: [
      'Delivery timeline depth depends on product and extension lifecycle signals.',
    ],
  },
  {
    key: 'specialist-workload-scorecard',
    title: 'Specialist Workload Scorecard',
    category: 'SPECIALISTS',
    ownerModule: 'COMPANY',
    description: 'Workload and KPIs.',
    audience: ['CEO', 'Head of Delivery', 'PM', 'Specialist'],
    supportedFilters: [...STANDARD_FILTERS, 'department', 'specialist'],
    supportedExports: [...STANDARD_EXPORTS],
    visualizations: ['kpi_cards', 'priority_bars', 'status_table'],
    sourceEndpoints: ['/api/tasks/stats', '/api/my-company/kpi'],
    drillDownHrefs: ['/tasks', '/my-company/kpi'],
    requiredPermissions: [{ module: 'TASKS', action: 'VIEW' }],
    status: 'READY',
    dataQualityNotes: ['Individual scorecards must respect task and KPI permissions.'],
  },
];

export function getReportDefinitions(): ReportDefinition[] {
  return [
    ...FINANCE_REPORT_DEFINITIONS.map(toFinanceReportDefinition),
    ...CROSS_MODULE_REPORT_DEFINITIONS,
  ];
}

export function findReportDefinition(
  reportKey: string,
  ownerModule?: string,
): ReportDefinition | undefined {
  return getReportDefinitions().find(
    (definition) =>
      definition.key === reportKey &&
      (ownerModule === undefined || definition.ownerModule === ownerModule),
  );
}

function toFinanceReportDefinition(
  definition: (typeof FINANCE_REPORT_DEFINITIONS)[number],
): ReportDefinition {
  return {
    key: definition.id,
    title: definition.title,
    category: 'FINANCE',
    ownerModule: 'FINANCE',
    description: definition.description,
    audience: definition.audience,
    supportedFilters: STANDARD_FILTERS,
    supportedExports: [...STANDARD_EXPORTS],
    visualizations: ['kpi_cards', 'finance_snapshot', 'detail_table'],
    sourceEndpoints: definition.sourceEndpoints,
    drillDownHrefs: definition.drillDownHrefs,
    requiredPermissions: FINANCE_PERMISSION,
    status: definition.v1Status === 'definition_ready' ? 'READY' : 'PARTIAL',
    dataQualityNotes: [definition.phase3Scope, definition.phase6Deferred],
    dataEndpoint: definition.aggregateEndpoint,
  };
}
