import { BadRequestException, Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Decimal, PayrollMatrixViewModeEnum, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { applyPayableSnapshotToBonusEntry } from '../bonus/bonus-payable-snapshot';
import { applyMatrixCellPatch, syncAfterMatrixReleaseMutation } from './payroll-matrix-cell-patch';
import { reassignMatrixBonusRecipientAndSync } from './payroll-matrix-bonus-reassign';
import { patchMatrixPlannedBonus } from './payroll-matrix-planned-bonus';
import {
  validatePayrollMatrixForApproval,
  type PayrollMatrixValidationIssue,
} from './payroll-matrix-approval-validation';
import { resolveDeliveryPayableUnits } from './delivery-payable-unit.resolver';
import {
  isPayrollMatrixBonusEntryVisible,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';
import {
  applyCustomOrder,
  loadPayrollMatrixLayout,
  savePayrollMatrixLayout,
} from './payroll-matrix-layout';
import type {
  CreatePayrollMatrixManualBonusBody,
  PatchPayrollMatrixCellBody,
  PatchPayrollMatrixLayoutBody,
  PatchPayrollMatrixPlannedBonusBody,
  PatchPayrollMatrixReassignBody,
  PayrollAllocationMatrixCell,
  PayrollAllocationMatrixDto,
  PayrollMatrixCellState,
} from './payroll-allocation-matrix.types';

const EDITABLE_STATUSES = new Set(['DRAFT', 'REVIEW']);

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
}

function resolveCellState(params: {
  linked: boolean;
  releaseAmount: ReturnType<typeof decimalFrom>;
  planned: ReturnType<typeof decimalFrom>;
  remaining: ReturnType<typeof decimalFrom>;
  availableFunding: ReturnType<typeof decimalFrom>;
  releaseType: string | null;
  manual: boolean;
}): PayrollMatrixCellState {
  if (!params.linked && params.releaseAmount.lte(BONUS_POOL_ZERO)) return 'UNLINKED';
  if (params.releaseAmount.lte(BONUS_POOL_ZERO)) return params.linked ? 'LINKED_EMPTY' : 'UNLINKED';
  if (params.releaseType === 'EXTRA' || params.releaseAmount.gt(params.remaining)) {
    return 'EXTRA_BONUS';
  }
  if (
    params.releaseType === 'OVER_FUNDING' ||
    (params.availableFunding.gt(BONUS_POOL_ZERO) &&
      params.releaseAmount.gt(params.availableFunding))
  ) {
    return 'OVER_FUNDING';
  }
  if (params.manual || params.releaseType === 'MANUAL' || params.releaseType === 'EARLY') {
    return 'MANUAL';
  }
  return 'RELEASE_SET';
}

@Injectable()
export class PayrollAllocationMatrixService {
  private readonly logger = new Logger(PayrollAllocationMatrixService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  async getValidation(payrollRunId: string): Promise<{ issues: PayrollMatrixValidationIssue[] }> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    const issues = await validatePayrollMatrixForApproval(this.prisma, payrollRunId);
    return { issues };
  }

  async getMatrix(
    payrollRunId: string,
    userId: string,
    viewMode: PayrollMatrixViewModeEnum = 'EMPLOYEE_MATRIX',
  ): Promise<PayrollAllocationMatrixDto> {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        salaryLines: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, position: true },
            },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    const layout = await loadPayrollMatrixLayout(this.prisma, userId, payrollRunId, viewMode);
    const deliveryUnits = await resolveDeliveryPayableUnits(
      this.prisma,
      payrollRunId,
      layout.pinnedUnitIds,
    );
    const orderIds = deliveryUnits.map((u) => u.orderId);

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        product: { select: { pmId: true, developerId: true, designerId: true } },
        bonusEntries: {
          select: {
            id: true,
            employeeId: true,
            title: true,
            type: true,
            amount: true,
            originalAmount: true,
            payableAmount: true,
            earnedPeriod: true,
            status: true,
          },
        },
      },
    });

    const releases = await this.prisma.bonusRelease.findMany({
      where: {
        bonusEntry: { orderId: { in: orderIds } },
        status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
      },
      select: {
        id: true,
        amount: true,
        payrollIncludedAmount: true,
        releaseType: true,
        payrollRunId: true,
        status: true,
        bonusEntry: {
          select: { employeeId: true, orderId: true, amount: true, originalAmount: true },
        },
      },
    });

    const employeeRows = run.salaryLines.map((line) => ({
      id: line.employee.id,
      employeeId: line.employee.id,
      firstName: line.employee.firstName,
      lastName: line.employee.lastName,
      position: line.employee.position,
      baseSalary: decimalFrom(line.baseSalary).toFixed(2),
      salaryLineId: line.id,
      bonusTotalThisRun: decimalFrom(line.bonusesTotal).toFixed(2),
      payableTotal: decimalFrom(line.totalPayable).toFixed(2),
    }));

    const orderedEmployees = applyCustomOrder(
      employeeRows.map((e) => ({ ...e, id: e.employeeId })),
      layout.rowOrder,
    );
    const orderedUnits = applyCustomOrder(
      deliveryUnits.map((u) => ({ ...u, id: u.orderId })),
      layout.columnOrder,
    );

    const unitByOrderId = new Map(deliveryUnits.map((u) => [u.orderId, u]));
    const orderMeta = new Map(orders.map((o) => [o.id, o]));

    const cells: PayrollAllocationMatrixCell[] = [];
    const editable = EDITABLE_STATUSES.has(run.status);

    for (const emp of orderedEmployees) {
      for (const unit of orderedUnits) {
        const order = orderMeta.get(unit.orderId);
        const linkedIds = new Set<string>();
        if (order) {
          order.bonusEntries
            .filter((b) => isPayrollMatrixBonusEntryVisible(b, run.payrollMonth))
            .forEach((b) => linkedIds.add(b.employeeId));
          if (order.product?.pmId) linkedIds.add(order.product.pmId);
          if (order.product?.developerId) linkedIds.add(order.product.developerId);
          if (order.product?.designerId) linkedIds.add(order.product.designerId);
        }
        const linked = linkedIds.has(emp.employeeId);
        const entry = order?.bonusEntries.find(
          (b) =>
            b.employeeId === emp.employeeId &&
            isPayrollMatrixBonusEntryVisible(b, run.payrollMonth),
        );
        const entryReleases = releases.filter(
          (r) =>
            r.bonusEntry.employeeId === emp.employeeId && r.bonusEntry.orderId === unit.orderId,
        );
        const thisRunRelease = entryReleases.find(
          (r) => r.payrollRunId === payrollRunId && r.status === 'INCLUDED_IN_PAYROLL',
        );
        const releasedBefore = sumBonusEntryReleasedBefore(entryReleases, payrollRunId);
        const paidBefore = entryReleases
          .filter((r) => r.status === 'PAID')
          .reduce(
            (s, r) => s.plus(decimalFrom(r.payrollIncludedAmount ?? r.amount)),
            BONUS_POOL_ZERO,
          );
        const planned = entry
          ? payrollBonusReleaseBase(
              {
                type: entry.type,
                amount: entry.amount,
                payableAmount: entry.payableAmount,
                earnedPeriod: entry.earnedPeriod,
              },
              run.payrollMonth,
            )
          : BONUS_POOL_ZERO;
        const original = entry?.originalAmount
          ? decimalFrom(entry.originalAmount)
          : entry
            ? decimalFrom(entry.amount)
            : null;
        const remaining = Decimal.max(BONUS_POOL_ZERO, planned.minus(releasedBefore));
        const releaseThisMonth = thisRunRelease
          ? decimalFrom(thisRunRelease.payrollIncludedAmount ?? thisRunRelease.amount)
          : BONUS_POOL_ZERO;
        const pool = unitByOrderId.get(unit.orderId);
        const availableFunding = pool ? decimalFrom(pool.availableFunding) : BONUS_POOL_ZERO;
        const manual = entryReleases.some(
          (r) => r.releaseType === 'MANUAL' || r.releaseType === 'EARLY',
        );
        const state = resolveCellState({
          linked,
          releaseAmount: releaseThisMonth,
          planned,
          remaining,
          availableFunding,
          releaseType: thisRunRelease?.releaseType ?? null,
          manual,
        });

        cells.push({
          employeeId: emp.employeeId,
          orderId: unit.orderId,
          state,
          linked,
          bonusTitle: entry?.title ?? null,
          bonusEntryId: entry?.id ?? null,
          bonusReleaseId: thisRunRelease?.id ?? null,
          plannedAmount: planned.toFixed(2),
          originalAmount: original?.toFixed(2) ?? null,
          currentAmount: planned.toFixed(2),
          releasedBefore: releasedBefore.toFixed(2),
          paidBefore: paidBefore.toFixed(2),
          remaining: remaining.toFixed(2),
          suggestedThisMonth: remaining.toFixed(2),
          releaseThisMonth: releaseThisMonth.toFixed(2),
          warning:
            state === 'OVER_FUNDING'
              ? 'Over funding'
              : state === 'EXTRA_BONUS'
                ? 'Extra bonus'
                : null,
          reasonRequired: false,
          editable: editable && (linked || state !== 'UNLINKED'),
        });
      }
    }

    return {
      payrollRunId: run.id,
      payrollMonth: run.payrollMonth,
      status: run.status,
      editable,
      employees: orderedEmployees.map(({ id: _id, ...rest }) => rest),
      deliveryUnits: orderedUnits.map(({ id: _id, ...rest }) => rest),
      cells,
      layout: { viewMode, ...layout },
      totals: {
        totalBaseSalary: decimalFrom(run.totalBaseSalary).toFixed(2),
        totalBonuses: decimalFrom(run.totalBonuses).toFixed(2),
        totalPayable: decimalFrom(run.totalPayable).toFixed(2),
        totalPaid: decimalFrom(run.totalPaid).toFixed(2),
        totalRemaining: decimalFrom(run.totalPayable).minus(decimalFrom(run.totalPaid)).toFixed(2),
      },
    };
  }

  async patchLayout(
    payrollRunId: string,
    userId: string,
    body: PatchPayrollMatrixLayoutBody,
  ): Promise<PayrollAllocationMatrixDto> {
    await savePayrollMatrixLayout(this.prisma, userId, payrollRunId, body.viewMode, {
      rowOrder: body.rowOrder,
      columnOrder: body.columnOrder,
      pinnedUnitIds: body.pinnedUnitIds,
    });
    return this.getMatrix(payrollRunId, userId, body.viewMode);
  }

  async patchCell(
    payrollRunId: string,
    userId: string,
    body: PatchPayrollMatrixCellBody,
  ): Promise<PayrollAllocationMatrixDto> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE_STATUSES.has(run.status)) {
      throw new BadRequestException('Payroll run is not editable');
    }

    const amount = decimalFrom(body.releaseThisMonth);
    const patchResult = await this.prisma.$transaction((tx) =>
      applyMatrixCellPatch(tx, {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        releaseAmount: amount.lt(BONUS_POOL_ZERO) ? BONUS_POOL_ZERO : amount,
        reason: body.reason,
        approvedById: userId,
      }),
    );
    await syncAfterMatrixReleaseMutation(this.prisma, patchResult, this.notifications);

    return this.getMatrix(payrollRunId, userId);
  }

  async patchPlannedBonus(
    payrollRunId: string,
    userId: string,
    body: PatchPayrollMatrixPlannedBonusBody,
  ): Promise<PayrollAllocationMatrixDto> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE_STATUSES.has(run.status)) {
      throw new BadRequestException('Payroll run is not editable');
    }

    const patchResult = await patchMatrixPlannedBonus(this.prisma, {
      employeeId: body.employeeId,
      orderId: body.orderId,
      amount: body.amount,
      title: body.title,
      reason: body.reason,
    });

    await this.audit.log({
      entityType: 'BonusEntry',
      entityId: patchResult.bonusEntryId,
      action: 'MATRIX_PLANNED_BONUS_UPDATED',
      userId,
      projectId: patchResult.projectId,
      changes: {
        payrollRunId,
        orderId: body.orderId,
        employeeId: body.employeeId,
        previousAmount: patchResult.previousAmount,
        nextAmount: patchResult.nextAmount,
        previousTitle: patchResult.previousTitle,
        nextTitle: body.title?.trim() ?? patchResult.previousTitle,
        reason: body.reason.trim(),
      },
    });

    return this.getMatrix(payrollRunId, userId);
  }

  async reassignRecipient(
    payrollRunId: string,
    userId: string,
    body: PatchPayrollMatrixReassignBody,
  ): Promise<PayrollAllocationMatrixDto> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE_STATUSES.has(run.status)) {
      throw new BadRequestException('Payroll run is not editable');
    }

    const reassignResult = await reassignMatrixBonusRecipientAndSync(this.prisma, {
      payrollRunId,
      fromEmployeeId: body.fromEmployeeId,
      orderId: body.orderId,
      toEmployeeId: body.toEmployeeId,
      reason: body.reason,
    });

    await this.audit.log({
      entityType: 'BonusEntry',
      entityId: reassignResult.bonusEntryId,
      action: 'MATRIX_BONUS_RECIPIENT_REASSIGNED',
      userId,
      projectId: reassignResult.projectId,
      changes: {
        payrollRunId,
        orderId: body.orderId,
        fromEmployeeId: body.fromEmployeeId,
        toEmployeeId: body.toEmployeeId,
        reason: body.reason.trim(),
      },
    });

    await syncAfterMatrixReleaseMutation(
      this.prisma,
      { releaseIds: [], carryNotifyEvents: reassignResult.carryNotifyEvents },
      this.notifications,
    );

    this.logger.log({
      msg: 'matrix_bonus_recipient_reassigned',
      payrollRunId,
      bonusEntryId: reassignResult.bonusEntryId,
      fromEmployeeId: body.fromEmployeeId,
      toEmployeeId: body.toEmployeeId,
    });

    return this.getMatrix(payrollRunId, userId);
  }

  async resetLayout(
    payrollRunId: string,
    userId: string,
    viewMode: PayrollMatrixViewModeEnum,
  ): Promise<PayrollAllocationMatrixDto> {
    await savePayrollMatrixLayout(this.prisma, userId, payrollRunId, viewMode, {
      rowOrder: [],
      columnOrder: [],
      pinnedUnitIds: [],
    });
    return this.getMatrix(payrollRunId, userId, viewMode);
  }

  async createManualBonus(
    payrollRunId: string,
    userId: string,
    body: CreatePayrollMatrixManualBonusBody,
  ): Promise<PayrollAllocationMatrixDto> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE_STATUSES.has(run.status)) {
      throw new BadRequestException('Payroll run is not editable');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      select: { id: true, projectId: true, type: true },
    });
    if (!order || (order.type !== 'PRODUCT' && order.type !== 'EXTENSION')) {
      throw new BadRequestException('Order is not a delivery payable unit');
    }

    const amount = decimalFrom(body.amount);
    const created = await this.prisma.bonusEntry.create({
      data: {
        title: body.title,
        employeeId: body.employeeId,
        orderId: body.orderId,
        projectId: order.projectId,
        type: 'DELIVERY',
        amount,
        originalAmount: amount,
        percent: BONUS_POOL_ZERO,
        status: 'ACTIVE',
        payoutMonth: new Date(`${run.payrollMonth}-01T00:00:00.000Z`),
      },
    });
    await applyPayableSnapshotToBonusEntry(this.prisma, created.id);

    const patchResult = await this.prisma.$transaction((tx) =>
      applyMatrixCellPatch(tx, {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        releaseAmount: amount,
        reason: body.reason,
        approvedById: userId,
      }),
    );
    await syncAfterMatrixReleaseMutation(this.prisma, patchResult, this.notifications);

    return this.getMatrix(payrollRunId, userId);
  }
}
