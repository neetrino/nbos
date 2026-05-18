import {
  ExtensionStatusEnum,
  ProductStatusEnum,
  PrismaClient,
  TaskStatusEnum,
} from '@nbos/database';
import { getMarketingDashboardSummary } from '../marketing/marketing-dashboard-summary';
import type { ReportDefinition, ReportDataQualityWarning } from './reports.types';

const CLOSED_TASK_STATUSES = [TaskStatusEnum.COMPLETED, TaskStatusEnum.ON_HOLD];
const INACTIVE_PRODUCT_STATUSES = [ProductStatusEnum.DONE, ProductStatusEnum.LOST];
const INACTIVE_EXTENSION_STATUSES = [ExtensionStatusEnum.DONE, ExtensionStatusEnum.LOST];

export async function buildRuntimeDataQualityWarnings(
  prisma: InstanceType<typeof PrismaClient>,
  definition: ReportDefinition,
): Promise<ReportDataQualityWarning[]> {
  if (definition.key === 'marketing-source-performance') {
    return buildMarketingWarnings(prisma, definition);
  }
  if (definition.key === 'sales-pipeline-health') {
    return buildSalesWarnings(prisma, definition);
  }
  if (definition.key === 'project-delivery-overview') {
    return buildProjectsWarnings(prisma, definition);
  }
  if (definition.key === 'specialist-workload-scorecard') {
    return buildSpecialistsWarnings(prisma, definition);
  }
  return [];
}

async function buildMarketingWarnings(
  prisma: InstanceType<typeof PrismaClient>,
  definition: ReportDefinition,
): Promise<ReportDataQualityWarning[]> {
  const summary = await getMarketingDashboardSummary(prisma);
  return summary.warnings.map((warning) =>
    runtimeWarning(
      definition,
      warning.code,
      `${warning.message} Affected records: ${warning.count}.`,
      {
        count: warning.count,
        affectedMetric: selectMarketingMetric(warning.code),
      },
    ),
  );
}

async function buildSalesWarnings(
  prisma: InstanceType<typeof PrismaClient>,
  definition: ReportDefinition,
): Promise<ReportDataQualityWarning[]> {
  const [leadsWithoutSource, dealsWithoutSource, wonDealsWithoutProject] = await Promise.all([
    prisma.lead.count({
      where: { source: null },
    }),
    prisma.deal.count({
      where: { source: null },
    }),
    prisma.deal.count({
      where: { status: 'WON', projectId: null },
    }),
  ]);
  return [
    optionalWarning(
      definition,
      'LEADS_MISSING_SOURCE',
      leadsWithoutSource,
      'Lead source distribution is partial because some leads have no source attribution.',
      'lead_source_distribution',
    ),
    optionalWarning(
      definition,
      'DEALS_MISSING_SOURCE',
      dealsWithoutSource,
      'Pipeline attribution is partial because some deals have no source attribution.',
      'pipeline_value',
    ),
    optionalWarning(
      definition,
      'WON_DEALS_WITHOUT_PROJECT_LINK',
      wonDealsWithoutProject,
      'Some WON deals are not linked to projects, so cross-module delivery projection is incomplete.',
      'won_deals',
    ),
  ].filter((item): item is ReportDataQualityWarning => item !== null);
}

async function buildProjectsWarnings(
  prisma: InstanceType<typeof PrismaClient>,
  definition: ReportDefinition,
): Promise<ReportDataQualityWarning[]> {
  const [productsWithoutPm, extensionsWithoutAssignee, linkedTasksWithoutAssignee] =
    await Promise.all([
      prisma.product.count({
        where: {
          pmId: null,
          status: { notIn: INACTIVE_PRODUCT_STATUSES },
        },
      }),
      prisma.extension.count({
        where: {
          assignedTo: null,
          status: { notIn: INACTIVE_EXTENSION_STATUSES },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: null,
          status: { notIn: CLOSED_TASK_STATUSES },
          links: {
            some: {
              entityType: { in: ['PRODUCT', 'EXTENSION'] },
            },
          },
        },
      }),
    ]);
  return [
    optionalWarning(
      definition,
      'PRODUCTS_WITHOUT_PM',
      productsWithoutPm,
      'Some active products have no PM assigned.',
      'product_lifecycle',
    ),
    optionalWarning(
      definition,
      'EXTENSIONS_WITHOUT_ASSIGNEE',
      extensionsWithoutAssignee,
      'Some active extensions have no assignee.',
      'extension_delivery',
    ),
    optionalWarning(
      definition,
      'LINKED_TASKS_WITHOUT_OWNER',
      linkedTasksWithoutAssignee,
      'Some product/extension tasks have no owner.',
      'risk_table',
    ),
  ].filter((item): item is ReportDataQualityWarning => item !== null);
}

async function buildSpecialistsWarnings(
  prisma: InstanceType<typeof PrismaClient>,
  definition: ReportDefinition,
): Promise<ReportDataQualityWarning[]> {
  const [openTasksWithoutOwner, openTasksWithoutWorkspace] = await Promise.all([
    prisma.task.count({
      where: {
        assigneeId: null,
        status: { notIn: CLOSED_TASK_STATUSES },
      },
    }),
    prisma.task.count({
      where: {
        workspaceId: null,
        status: { notIn: CLOSED_TASK_STATUSES },
      },
    }),
  ]);
  return [
    optionalWarning(
      definition,
      'OPEN_TASKS_WITHOUT_OWNER',
      openTasksWithoutOwner,
      'Workload scorecard is partial because some open tasks have no owner.',
      'task_status',
    ),
    optionalWarning(
      definition,
      'OPEN_TASKS_WITHOUT_WORKSPACE',
      openTasksWithoutWorkspace,
      'Some open tasks are not attached to a workspace.',
      'workload_scope',
    ),
  ].filter((item): item is ReportDataQualityWarning => item !== null);
}

function optionalWarning(
  definition: ReportDefinition,
  code: string,
  count: number,
  message: string,
  affectedMetric: string,
): ReportDataQualityWarning | null {
  if (count <= 0) return null;
  return runtimeWarning(definition, code, `${message} Affected records: ${count}.`, {
    count,
    affectedMetric,
  });
}

function runtimeWarning(
  definition: ReportDefinition,
  code: string,
  message: string,
  details: { count?: number; affectedMetric?: string },
): ReportDataQualityWarning {
  return {
    reportKey: definition.key,
    reportTitle: definition.title,
    ownerModule: definition.ownerModule,
    severity: 'WARNING',
    code,
    message,
    sourceEndpoints: definition.sourceEndpoints,
    sourceKind: 'RUNTIME',
    details,
  };
}

function selectMarketingMetric(code: string): string {
  if (code === 'MISSING_ACCOUNT_FINANCE_LINKS') return 'spend_readiness';
  if (code === 'MISSING_ACTIVITY_EXPENSE_LINKS') return 'spend_readiness';
  if (code === 'EFFICIENCY_PARTIAL_DATA') return 'roas';
  if (code === 'NO_SPEND_BASELINE') return 'roas';
  if (code === 'NO_WON_ATTRIBUTED_DEALS') return 'cost_per_won_deal';
  return 'marketing_efficiency';
}
