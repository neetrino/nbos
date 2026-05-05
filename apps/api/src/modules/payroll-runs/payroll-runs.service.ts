import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { parsePayrollRunStatusQuery } from './payroll-run-list-scope';
import {
  queryPayrollRunList,
  queryPayrollRunListStats,
  type PayrollRunListParams,
} from './payroll-run-list-queries';
import { canTransitionPayrollRun } from './payroll-run-status-transitions';
import { materializePayrollExpensesForApprovedRun } from './payroll-materialize-expenses';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { buildPayrollRunJournal } from './payroll-run-journal';
import {
  PAYROLL_RUN_AUDIT_ACTION_CREATED,
  PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
  PAYROLL_RUN_AUDIT_ENTITY_TYPE,
} from './payroll-run-audit.constants';
import { loadPayrollRunAuditTrail } from './payroll-run-audit-trail';
import { fetchMaterializedSalaryLineCountByPayrollRunId } from './payroll-run-materialized-line-counts';
import { type PayrollRunStatsResult } from './payroll-run-list-stats';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';
import { refreshBonusEntryStatusesForReleases } from './payroll-run-bonus-release-side-effects';
import { applyPayrollRunKpiPatch, type PatchPayrollRunBody } from './payroll-run-kpi-patch';

export type { PayrollRunListParams } from './payroll-run-list-queries';
export type { PayrollRunStatsResult } from './payroll-run-list-stats';
export type { PatchPayrollRunBody };

export interface CreatePayrollRunBody {
  payrollMonth: string;
  /** When true (default), create salary lines from active employees using `Employee.baseSalary`. */
  seedLines?: boolean;
}

/** Actor for audit rows on status transitions (`PATCH …/status`). */
export interface PayrollRunStatusMeta {
  actorUserId: string;
  approvedById?: string | null;
}

@Injectable()
export class PayrollRunsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: PayrollRunListParams) {
    return queryPayrollRunList(this.prisma, params);
  }

  async getStats(
    params: Pick<PayrollRunListParams, 'status' | 'payrollMonthFrom' | 'payrollMonthTo'>,
  ): Promise<PayrollRunStatsResult> {
    return queryPayrollRunListStats(this.prisma, params);
  }

  async findById(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        salaryLines: {
          orderBy: { createdAt: 'asc' },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, email: true } },
            expense: { select: { id: true, name: true, amount: true, status: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

    const [materializedByRun, auditTrail] = await Promise.all([
      fetchMaterializedSalaryLineCountByPayrollRunId(this.prisma, [id]),
      loadPayrollRunAuditTrail(this.prisma, PAYROLL_RUN_AUDIT_ENTITY_TYPE, id),
    ]);

    return {
      ...run,
      materializedExpenseLineCount: materializedByRun.get(id) ?? 0,
      journal: buildPayrollRunJournal(run),
      auditTrail,
    };
  }

  async patchPayrollRun(id: string, body: PatchPayrollRunBody) {
    await applyPayrollRunKpiPatch(this.prisma, id, body);
    return this.findById(id);
  }

  async create(body: CreatePayrollRunBody, createdById?: string | null) {
    const month = body.payrollMonth.trim();
    if (!isValidPayrollMonth(month)) {
      throw new BadRequestException('payrollMonth must be YYYY-MM');
    }

    const existing = await this.prisma.payrollRun.findUnique({ where: { payrollMonth: month } });
    if (existing) {
      throw new ConflictException(`Payroll run already exists for ${month}`);
    }

    const seedLines = body.seedLines !== false;

    const newId = await this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          payrollMonth: month,
          createdById: createdById ?? undefined,
        },
      });

      if (seedLines) {
        const employees = await tx.employee.findMany({
          where: { status: { not: 'TERMINATED' } },
          select: { id: true, baseSalary: true },
        });

        for (const emp of employees) {
          const base = emp.baseSalary ?? new Decimal(0);
          const zero = new Decimal(0);
          const totalPayable = base;
          await tx.salaryLine.create({
            data: {
              payrollRunId: run.id,
              employeeId: emp.id,
              baseSalary: base,
              bonusesTotal: zero,
              adjustmentsTotal: zero,
              deductionsTotal: zero,
              totalPayable,
              paidAmount: zero,
              remainingAmount: totalPayable,
            },
          });
        }
      }

      await recalculatePayrollRunTotalsFromSalaryLines(tx, run.id);

      if (createdById) {
        await tx.auditLog.create({
          data: {
            entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE,
            entityId: run.id,
            action: PAYROLL_RUN_AUDIT_ACTION_CREATED,
            userId: createdById,
            changes: { payrollMonth: month, status: 'DRAFT' },
          },
        });
      }

      return run.id;
    });

    return this.findById(newId);
  }

  async updateStatus(id: string, nextStatus: string, meta: PayrollRunStatusMeta) {
    const status = parsePayrollRunStatusQuery(nextStatus);
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

    if (!canTransitionPayrollRun(run.status, status)) {
      throw new ConflictException(`Cannot transition payroll run from ${run.status} to ${status}`);
    }

    const data: Prisma.PayrollRunUpdateInput = { status };

    if (status === 'APPROVED') {
      data.approvedAt = new Date();
      if (meta.approvedById) {
        data.approvedBy = { connect: { id: meta.approvedById } };
      }
    }

    if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payrollRun.update({ where: { id }, data });
      let materializedExpenseIds: string[] | undefined;
      if (status === 'APPROVED') {
        const { createdExpenseIds } = await materializePayrollExpensesForApprovedRun(tx, {
          payrollRunId: id,
          payrollMonth: run.payrollMonth,
        });
        if (createdExpenseIds.length > 0) {
          materializedExpenseIds = createdExpenseIds;
        }
      }
      await tx.auditLog.create({
        data: {
          entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE,
          entityId: id,
          action: PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
          userId: meta.actorUserId,
          changes:
            materializedExpenseIds && materializedExpenseIds.length > 0
              ? { from: run.status, to: status, materializedExpenseIds }
              : { from: run.status, to: status },
        },
      });
    });

    return this.findById(id);
  }

  /** NBOS: attach APPROVED bonus releases to this run’s salary lines (DRAFT/REVIEW). */
  async attachBonusReleases(payrollRunId: string, body: { releaseIds: string[] }) {
    const uniqueIds = [...new Set(body.releaseIds)];
    await this.prisma.$transaction(async (tx) => {
      await attachBonusReleasesToPayrollRun(tx, {
        payrollRunId,
        releaseIds: uniqueIds,
      });
    });
    await refreshBonusEntryStatusesForReleases(this.prisma, uniqueIds);
    return this.findById(payrollRunId);
  }

  /** NBOS: detach INCLUDED_IN_PAYROLL releases back to APPROVED (DRAFT/REVIEW). */
  async detachBonusReleases(payrollRunId: string, body: { releaseIds: string[] }) {
    const uniqueIds = [...new Set(body.releaseIds)];
    await this.prisma.$transaction(async (tx) => {
      await detachBonusReleasesFromPayrollRun(tx, {
        payrollRunId,
        releaseIds: uniqueIds,
      });
    });
    await refreshBonusEntryStatusesForReleases(this.prisma, uniqueIds);
    return this.findById(payrollRunId);
  }
}
