import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import { computeKpiGatePayoutFactor } from './kpi-gate-payout';
import { parseKpiGateRules } from './parse-kpi-gate-rules';
import { earnedSalesPeriodForPayoutMonth } from './earned-sales-kpi-period';
import { listSalesPaymentFactsForEmployee } from './payroll-run-suggested-sales-actual';
import type {
  PayrollRunKpiResultDto,
  PayrollRunKpiResultsDto,
} from './payroll-run-kpi-result.types';

function money(value: Decimal | null): string | null {
  return value == null ? null : value.toFixed(2);
}

function employeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function attainmentPct(plan: Decimal | null, actual: Decimal | null): Decimal | null {
  if (plan == null || actual == null || plan.lte(0)) return null;
  return actual.div(plan).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function payoutFactor(plan: Decimal | null, actual: Decimal | null, rules: unknown): Decimal {
  if (plan == null || actual == null) return new Decimal(1);
  return computeKpiGatePayoutFactor(plan, actual, parseKpiGateRules(rules));
}

function mapKpiResult(row: {
  id: string;
  employeeId: string;
  period: string;
  kpiPolicyId: string | null;
  compensationProfileId: string | null;
  planAmount: Decimal | null;
  actualAmount: Decimal | null;
  attainmentPct: Decimal | null;
  payoutFactor: Decimal;
  source: string;
  sourceFacts: unknown;
  employee: { firstName: string; lastName: string };
}): PayrollRunKpiResultDto {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: employeeName(row.employee),
    period: row.period,
    kpiPolicyId: row.kpiPolicyId,
    compensationProfileId: row.compensationProfileId,
    planAmount: money(row.planAmount),
    actualAmount: money(row.actualAmount),
    attainmentPct: money(row.attainmentPct),
    payoutFactor: row.payoutFactor.toFixed(4),
    source: row.source,
    sourceFacts: row.sourceFacts,
  };
}

@Injectable()
export class PayrollRunKpiResultService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listForPayrollRun(payrollRunId: string): Promise<PayrollRunKpiResultsDto> {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      select: { id: true, payrollMonth: true },
    });
    if (!run) throw new NotFoundException(`Payroll run ${payrollRunId} not found`);

    const rows = await this.prisma.kpiResult.findMany({
      where: { payrollRunId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: [{ employee: { lastName: 'asc' } }, { createdAt: 'asc' }],
    });

    return {
      payrollRunId: run.id,
      payrollMonth: run.payrollMonth,
      items: rows.map(mapKpiResult),
    };
  }

  async syncSalesForPayrollRun(payrollRunId: string): Promise<PayrollRunKpiResultsDto> {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      select: {
        id: true,
        payrollMonth: true,
        salaryLines: {
          select: {
            id: true,
            employeeId: true,
            compensationProfileId: true,
          },
        },
      },
    });
    if (!run) throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
    if (run.salaryLines.length === 0) {
      throw new BadRequestException('Payroll run has no salary lines to resolve KPI results.');
    }

    const earnedPeriod = earnedSalesPeriodForPayoutMonth(run.payrollMonth);

    for (const line of run.salaryLines) {
      const profile = await resolveCompensationProfileForPayrollMonth(
        this.prisma,
        line.employeeId,
        run.payrollMonth,
      );
      if (!profile?.kpiPolicyId) continue;

      const policy = await this.prisma.kpiPolicy.findFirst({
        where: { id: profile.kpiPolicyId, status: 'ACTIVE' },
        select: {
          id: true,
          gateRules: true,
          targetAmount: true,
          targetSource: true,
          resultSource: true,
        },
      });
      if (!policy) continue;

      const facts = await listSalesPaymentFactsForEmployee(
        this.prisma,
        earnedPeriod,
        line.employeeId,
      );
      const plan = policy.targetAmount;
      const actual = facts.total;
      const pct = attainmentPct(plan, actual);
      const factor = payoutFactor(plan, actual, policy.gateRules);
      const sourceFacts = {
        targetSource: policy.targetSource,
        resultSource: policy.resultSource ?? 'SALES_PAYMENTS',
        salesPayments: facts.payments,
      };

      await this.prisma.kpiResult.upsert({
        where: {
          employeeId_period_kpiPolicyId: {
            employeeId: line.employeeId,
            period: earnedPeriod,
            kpiPolicyId: policy.id,
          },
        },
        create: {
          employeeId: line.employeeId,
          kpiPolicyId: policy.id,
          compensationProfileId: line.compensationProfileId ?? profile.id,
          payrollRunId: run.id,
          salaryLineId: line.id,
          period: earnedPeriod,
          planAmount: plan,
          actualAmount: actual,
          attainmentPct: pct,
          payoutFactor: factor,
          source: 'SYSTEM',
          sourceFacts,
        },
        update: {
          compensationProfileId: line.compensationProfileId ?? profile.id,
          payrollRunId: run.id,
          salaryLineId: line.id,
          planAmount: plan,
          actualAmount: actual,
          attainmentPct: pct,
          payoutFactor: factor,
          source: 'SYSTEM',
          sourceFacts,
        },
      });
    }

    return this.listForPayrollRun(payrollRunId);
  }
}
