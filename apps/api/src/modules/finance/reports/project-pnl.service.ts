import { Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildDateFilter,
  COMPANY_PNL_CURRENCY,
  decimalString,
  marginPercent,
  parseCompanyPnlPeriod,
  periodIsoDate,
} from './company-pnl-helpers';
import type { ProjectPnlQuery, ProjectPnlReport, ProjectPnlRow } from './project-pnl.types';

const PROJECT_PNL_TOP_LIMIT = 10;
const PROJECT_PNL_NOTES = [
  'Project P&L v1 is cash-driven until Operational Journal accrual entries exist.',
  'Revenue uses Payment rows through Invoice.projectId.',
  'Costs use ExpensePayment rows through Expense.projectId.',
  'Payments or costs without project_id are intentionally excluded instead of being allocated.',
];

@Injectable()
export class ProjectPnlService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: ProjectPnlQuery = {}): Promise<ProjectPnlReport> {
    const period = parseCompanyPnlPeriod(query);
    const dateFilter = buildDateFilter(period);
    const [payments, expensePayments] = await Promise.all([
      this.getPaymentRows(dateFilter),
      this.getExpensePaymentRows(dateFilter),
    ]);
    const projectIds = collectProjectIds(payments, expensePayments);
    const projects = await this.getProjects(projectIds);
    const rows = buildProjectRows(payments, expensePayments, projects);
    const totals = buildTotals(rows);

    return {
      reportId: 'project-pnl',
      title: 'Project P&L',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        basis: 'cash',
      },
      totals,
      topProjects: rows.slice(0, PROJECT_PNL_TOP_LIMIT),
      notes: PROJECT_PNL_NOTES,
    };
  }

  private getPaymentRows(paymentDate: ReturnType<typeof buildDateFilter>) {
    return this.prisma.payment.findMany({
      ...(paymentDate ? { where: { paymentDate } } : {}),
      select: {
        amount: true,
        invoice: { select: { projectId: true } },
      },
    });
  }

  private getExpensePaymentRows(paymentDate: ReturnType<typeof buildDateFilter>) {
    return this.prisma.expensePayment.findMany({
      ...(paymentDate ? { where: { paymentDate } } : {}),
      select: {
        amount: true,
        expense: { select: { projectId: true } },
      },
    });
  }

  private getProjects(projectIds: string[]) {
    if (projectIds.length === 0) return Promise.resolve([]);
    return this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, code: true, name: true },
    });
  }
}

interface PaymentRow {
  amount: Decimal;
  invoice: { projectId: string };
}

interface ExpensePaymentRow {
  amount: Decimal;
  expense: { projectId: string | null };
}

interface ProjectAccumulator {
  projectId: string;
  revenue: Decimal;
  actualCosts: Decimal;
  paymentCount: number;
  expensePaymentCount: number;
}

function collectProjectIds(payments: PaymentRow[], expensePayments: ExpensePaymentRow[]): string[] {
  const ids = new Set<string>();
  for (const row of payments) ids.add(row.invoice.projectId);
  for (const row of expensePayments) {
    if (row.expense.projectId) ids.add(row.expense.projectId);
  }
  return [...ids];
}

function buildProjectRows(
  payments: PaymentRow[],
  expensePayments: ExpensePaymentRow[],
  projects: Array<{ id: string; code: string; name: string }>,
): ProjectPnlRow[] {
  const byProject = new Map<string, ProjectAccumulator>();
  for (const row of payments) {
    const acc = getProjectAccumulator(byProject, row.invoice.projectId);
    acc.revenue = acc.revenue.plus(row.amount);
    acc.paymentCount += 1;
  }
  for (const row of expensePayments) {
    if (!row.expense.projectId) continue;
    const acc = getProjectAccumulator(byProject, row.expense.projectId);
    acc.actualCosts = acc.actualCosts.plus(row.amount);
    acc.expensePaymentCount += 1;
  }
  const projectById = new Map(projects.map((project) => [project.id, project]));
  return [...byProject.values()]
    .map((acc) => toProjectRow(acc, projectById.get(acc.projectId)))
    .sort((a, b) => Number(b.netProfit) - Number(a.netProfit));
}

function getProjectAccumulator(map: Map<string, ProjectAccumulator>, projectId: string) {
  const existing = map.get(projectId);
  if (existing) return existing;
  const next = {
    projectId,
    revenue: new Decimal(0),
    actualCosts: new Decimal(0),
    paymentCount: 0,
    expensePaymentCount: 0,
  };
  map.set(projectId, next);
  return next;
}

function toProjectRow(
  acc: ProjectAccumulator,
  project: { code: string; name: string } | undefined,
): ProjectPnlRow {
  const netProfit = acc.revenue.minus(acc.actualCosts);
  return {
    projectId: acc.projectId,
    projectCode: project?.code ?? null,
    projectName: project?.name ?? 'Unknown project',
    revenue: decimalString(acc.revenue),
    actualCosts: decimalString(acc.actualCosts),
    netProfit: decimalString(netProfit),
    marginPercent: marginPercent(netProfit, acc.revenue),
    paymentCount: acc.paymentCount,
    expensePaymentCount: acc.expensePaymentCount,
  };
}

function buildTotals(rows: ProjectPnlRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue.plus(row.revenue),
      actualCosts: acc.actualCosts.plus(row.actualCosts),
      paymentCount: acc.paymentCount + row.paymentCount,
      expensePaymentCount: acc.expensePaymentCount + row.expensePaymentCount,
    }),
    {
      revenue: new Decimal(0),
      actualCosts: new Decimal(0),
      paymentCount: 0,
      expensePaymentCount: 0,
    },
  );
  const netProfit = totals.revenue.minus(totals.actualCosts);
  return {
    projectCount: rows.length,
    revenue: decimalString(totals.revenue),
    actualCosts: decimalString(totals.actualCosts),
    netProfit: decimalString(netProfit),
    marginPercent: marginPercent(netProfit, totals.revenue),
    paymentCount: totals.paymentCount,
    expensePaymentCount: totals.expensePaymentCount,
  };
}
