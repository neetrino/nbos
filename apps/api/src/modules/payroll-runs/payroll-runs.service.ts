import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import { isValidPayrollMonth } from './payroll-runs.constants';
import {
  queryPayrollRunList,
  queryPayrollRunListStats,
  type PayrollRunListParams,
} from './payroll-run-list-queries';
import {
  commitLockedPayrollRunStatus,
  preparePayrollRunStatusUpdate,
} from './payroll-run-status-commit';
import { publishPayrollStatusSideEffects } from './payroll-run-status-side-effects';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import {
  PAYROLL_RUN_AUDIT_ACTION_CREATED,
  PAYROLL_RUN_AUDIT_ENTITY_TYPE,
} from './payroll-run-audit.constants';
import { type PayrollRunStatsResult } from './payroll-run-list-stats';
import { notifyEmployeesOnPayrollRunCreated } from './payroll-run-employee-wallet-notify';
import {
  querySalaryBoard,
  type SalaryBoardQueryParams,
  type SalaryBoardResponseDto,
} from './payroll-salary-board';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';
import { seedPayrollRunSalaryLines } from './seed-payroll-run-salary-lines';
import { querySalaryLineMonthDetail } from './salary-line-month-detail';
import {
  assignEmployeeSalesKpiPlan,
  type AssignEmployeeSalesKpiPlanInput,
  type AssignedEmployeeSalesKpiPlan,
} from './assign-employee-sales-kpi-plan';
import type { SalaryLineMonthDetailDto } from './salary-line-month-detail.types';
import {
  assertPayrollWriteAccess,
  assertSalaryLineReadable,
  overlayPayrollRunListTotals,
  resolvePayrollReadAccess,
} from './payroll-run-access';
import { loadPayrollRunDetail } from './payroll-run-detail';
import { queryDepartmentPayrollRunListStats } from './payroll-run-scoped-stats';

export type { SalaryLineMonthDetailDto } from './salary-line-month-detail.types';

export type { PayrollRunListParams } from './payroll-run-list-queries';
export type { PayrollRunStatsResult } from './payroll-run-list-stats';
export type { SalaryBoardQueryParams, SalaryBoardResponseDto } from './payroll-salary-board';

export interface CreatePayrollRunBody {
  payrollMonth: string;
  /** When true (default), seed salary lines from approved profiles covering the payroll month. */
  seedLines?: boolean;
}

@Injectable()
export class PayrollRunsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  async findAll(actor: FinancePayActor, params: PayrollRunListParams) {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    const result = await queryPayrollRunList(this.prisma, params);
    return {
      ...result,
      items: await overlayPayrollRunListTotals(this.prisma, result.items, accessible),
    };
  }

  async getStats(
    actor: FinancePayActor,
    params: Pick<PayrollRunListParams, 'status' | 'payrollMonthFrom' | 'payrollMonthTo'>,
  ): Promise<PayrollRunStatsResult> {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    if (accessible === 'ALL') {
      return queryPayrollRunListStats(this.prisma, params);
    }
    return queryDepartmentPayrollRunListStats(this.prisma, params, accessible);
  }

  async getSalaryBoard(
    actor: FinancePayActor,
    params: SalaryBoardQueryParams,
  ): Promise<SalaryBoardResponseDto> {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    return querySalaryBoard(this.prisma, {
      ...params,
      employeeIds: accessible === 'ALL' ? undefined : accessible,
    });
  }

  async getSalaryLineMonthDetail(
    actor: FinancePayActor,
    salaryLineId: string,
  ): Promise<SalaryLineMonthDetailDto> {
    await assertSalaryLineReadable(this.prisma, actor, salaryLineId);
    return querySalaryLineMonthDetail(this.prisma, salaryLineId);
  }

  async assignEmployeeSalesKpiPlan(
    actor: FinancePayActor,
    body: AssignEmployeeSalesKpiPlanInput,
  ): Promise<AssignedEmployeeSalesKpiPlan> {
    return assignEmployeeSalesKpiPlan(this.prisma, actor, body);
  }

  async findById(actor: FinancePayActor, id: string) {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    return loadPayrollRunDetail(this.prisma, id, accessible);
  }

  async create(actor: FinancePayActor, body: CreatePayrollRunBody) {
    assertPayrollWriteAccess(actor, 'ADD');
    const createdById = actor.id;
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
        await seedPayrollRunSalaryLines(tx, run.id, month);
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

    if (seedLines) {
      await notifyEmployeesOnPayrollRunCreated(this.prisma, this.notifications, newId, month);
    }

    return this.findById(actor, newId);
  }

  async updateStatus(actor: FinancePayActor, id: string, nextStatus: string) {
    assertPayrollWriteAccess(actor, 'EDIT');
    const prepared = await preparePayrollRunStatusUpdate(this.prisma, id, nextStatus, actor.id);
    const committed = await this.prisma.$transaction((tx) =>
      commitLockedPayrollRunStatus(tx, {
        payrollRunId: id,
        nextStatus: prepared.status,
        data: prepared.data,
        actorUserId: actor.id,
      }),
    );
    await publishPayrollStatusSideEffects(this.prisma, this.notifications, {
      payrollRunId: id,
      payrollMonth: prepared.payrollMonth,
      nextStatus: prepared.status,
      bonus: committed.materializedBonus,
    });
    return this.findById(actor, id);
  }
}
