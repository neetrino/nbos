import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type PayrollRunStatusEnum,
  type Prisma,
  type TransactionClient,
} from '@nbos/database';

import {
  materializePayrollBonusAllocationDrafts,
  type PayrollBonusAllocationMaterializeResult,
} from './payroll-bonus-allocation-materialize';
import { materializePayrollExpensesForApprovedRun } from './payroll-materialize-expenses';
import {
  PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
  PAYROLL_RUN_AUDIT_ENTITY_TYPE,
} from './payroll-run-audit.constants';
import { loadSalaryLinesBlockingPayrollCloseCount } from './payroll-run-close-validation';
import { parsePayrollRunStatusQuery } from './payroll-run-list-scope';
import { validatePayrollMatrixForApproval } from './payroll-matrix-approval-validation';
import { canTransitionPayrollRun } from './payroll-run-status-transitions';

export type LockedPayrollStatusParams = {
  payrollRunId: string;
  nextStatus: PayrollRunStatusEnum;
  data: Prisma.PayrollRunUpdateInput;
  actorUserId: string;
};

export type LockedPayrollStatusResult = {
  materializedBonus?: PayrollBonusAllocationMaterializeResult;
};

type LockedRun = { status: PayrollRunStatusEnum; payrollMonth: string };

/**
 * Serializes payroll status changes. A second approval waits, re-reads the row,
 * and stops before creating another expense.
 */
export async function commitLockedPayrollRunStatus(
  tx: TransactionClient,
  params: LockedPayrollStatusParams,
): Promise<LockedPayrollStatusResult> {
  const locked = await lockPayrollRun(tx, params.payrollRunId);
  assertLockedTransition(locked.status, params.nextStatus);
  const materializedBonus = await materializeDraftsWhenApproving(tx, locked, params);
  await tx.payrollRun.update({ where: { id: params.payrollRunId }, data: params.data });
  const materializedExpenseIds = await materializeExpensesWhenApproving(tx, locked, params);
  await writeStatusAudit(tx, locked.status, materializedExpenseIds, params);
  return materializedBonus == null ? {} : { materializedBonus };
}

async function lockPayrollRun(tx: TransactionClient, payrollRunId: string): Promise<LockedRun> {
  await tx.$queryRaw`SELECT id FROM payroll_runs WHERE id = ${payrollRunId} FOR UPDATE`;
  const locked = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { status: true, payrollMonth: true },
  });
  if (!locked) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  return locked;
}

function assertLockedTransition(from: PayrollRunStatusEnum, to: PayrollRunStatusEnum): void {
  if (!canTransitionPayrollRun(from, to)) {
    throw new ConflictException(`Cannot transition payroll run from ${from} to ${to}`);
  }
}

async function materializeDraftsWhenApproving(
  tx: TransactionClient,
  locked: LockedRun,
  params: LockedPayrollStatusParams,
): Promise<PayrollBonusAllocationMaterializeResult | undefined> {
  if (locked.status !== 'REVIEW' || params.nextStatus !== 'APPROVED') {
    return undefined;
  }
  return materializePayrollBonusAllocationDrafts(tx, {
    payrollRunId: params.payrollRunId,
    payrollMonth: locked.payrollMonth,
    actorUserId: params.actorUserId,
  });
}

async function materializeExpensesWhenApproving(
  tx: TransactionClient,
  locked: LockedRun,
  params: LockedPayrollStatusParams,
): Promise<string[]> {
  if (params.nextStatus !== 'APPROVED') {
    return [];
  }
  const created = await materializePayrollExpensesForApprovedRun(tx, {
    payrollRunId: params.payrollRunId,
    payrollMonth: locked.payrollMonth,
  });
  return created.createdExpenseIds;
}

export type PreparedPayrollStatusUpdate = {
  status: PayrollRunStatusEnum;
  payrollMonth: string;
  data: Prisma.PayrollRunUpdateInput;
};

/** Reads the run and rejects a transition that is already impossible before the row lock. */
export async function preparePayrollRunStatusUpdate(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  nextStatus: string,
  actorId: string,
): Promise<PreparedPayrollStatusUpdate> {
  const status = parsePayrollRunStatusQuery(nextStatus);
  const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  assertLockedTransition(run.status, status);
  await assertApprovalMatrix(prisma, payrollRunId, status);
  await assertCloseIsFullyPaid(prisma, payrollRunId, status);
  return { status, payrollMonth: run.payrollMonth, data: statusPatch(status, actorId) };
}

async function assertApprovalMatrix(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  status: PayrollRunStatusEnum,
): Promise<void> {
  if (status !== 'APPROVED') {
    return;
  }
  const matrixIssues = await validatePayrollMatrixForApproval(prisma, payrollRunId);
  if (matrixIssues.length > 0) {
    throw new BadRequestException({
      message: 'Payroll matrix validation failed',
      issues: matrixIssues,
    });
  }
}

async function assertCloseIsFullyPaid(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunId: string,
  status: PayrollRunStatusEnum,
): Promise<void> {
  if (status !== 'CLOSED') {
    return;
  }
  const blockingCount = await loadSalaryLinesBlockingPayrollCloseCount(prisma, payrollRunId);
  if (blockingCount > 0) {
    throw new ConflictException(
      `Cannot close payroll run: ${blockingCount} salary line(s) are not fully paid or held.`,
    );
  }
}

function statusPatch(status: PayrollRunStatusEnum, actorId: string): Prisma.PayrollRunUpdateInput {
  const data: Prisma.PayrollRunUpdateInput = { status };
  if (status === 'APPROVED') {
    data.approvedAt = new Date();
    data.approvedBy = { connect: { id: actorId } };
  }
  if (status === 'CLOSED') {
    data.closedAt = new Date();
  }
  return data;
}

async function writeStatusAudit(
  tx: TransactionClient,
  from: PayrollRunStatusEnum,
  materializedExpenseIds: string[],
  params: LockedPayrollStatusParams,
): Promise<void> {
  const changes =
    materializedExpenseIds.length > 0
      ? { from, to: params.nextStatus, materializedExpenseIds }
      : { from, to: params.nextStatus };
  await tx.auditLog.create({
    data: {
      entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE,
      entityId: params.payrollRunId,
      action: PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
      userId: params.actorUserId,
      changes,
    },
  });
}
