import { BadRequestException, Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  PayrollMatrixViewModeEnum,
  PrismaClient,
  type PayrollBonusAllocationKindEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { syncAfterMatrixReleaseMutation } from './payroll-matrix-cell-patch';
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

const EDITABLE_STATUSES = new Set(['DRAFT']);
const DRAFT_PREVIEW_STATUSES = new Set(['DRAFT', 'REVIEW']);

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
}

export function resolvePayrollMatrixCellState(params: {
  linked: boolean;
  hasBonusEntry: boolean;
  releaseAmount: ReturnType<typeof decimalFrom>;
  remaining: ReturnType<typeof decimalFrom>;
  availableFunding: ReturnType<typeof decimalFrom>;
  deliveryOpen: boolean;
  manualBonus: boolean;
}): PayrollMatrixCellState {
  if (!params.linked && params.releaseAmount.lte(BONUS_POOL_ZERO)) {
    return 'UNLINKED';
  }
  if (!params.hasBonusEntry && !params.manualBonus) {
    return params.linked ? 'LINKED_EMPTY' : 'UNLINKED';
  }
  if (params.hasBonusEntry && params.deliveryOpen && params.releaseAmount.lte(BONUS_POOL_ZERO)) {
    return 'LINKED_EMPTY';
  }
  if (
    params.availableFunding.gt(BONUS_POOL_ZERO) &&
    params.releaseAmount.gt(params.availableFunding)
  ) {
    return 'OVER_FUNDING';
  }
  if (params.manualBonus) {
    return 'MANUAL_BONUS';
  }
  if (params.releaseAmount.gt(params.remaining)) {
    return 'EXTRA_BONUS';
  }
  if (params.deliveryOpen) return 'PROGRESS';
  if (params.availableFunding.lt(params.remaining)) return 'PARTIALLY_FUNDED';
  return 'READY';
}

function sumMoney(values: string[]): Decimal {
  return values.reduce((sum, value) => sum.plus(decimalFrom(value)), BONUS_POOL_ZERO);
}

function allocationKindFromCellState(
  state: PayrollMatrixCellState,
): PayrollBonusAllocationKindEnum {
  if (state === 'EXTRA_BONUS') return 'EXTRA_BONUS';
  if (state === 'OVER_FUNDING') return 'OVER_FUNDING';
  if (state === 'MANUAL_BONUS') return 'MANUAL_BONUS';
  if (state === 'PROGRESS') return 'PROGRESS';
  if (state === 'PARTIALLY_FUNDED') return 'PARTIALLY_FUNDED';
  return 'READY';
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
            dealId: true,
            salesAccrualInvoiceId: true,
            calculationSnapshot: true,
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
    const draftAllocations = await this.prisma.payrollBonusAllocationDraft.findMany({
      where: { payrollRunId },
      select: {
        id: true,
        employeeId: true,
        orderId: true,
        bonusEntryId: true,
        amount: true,
        kind: true,
      },
    });
    const draftByCell = new Map(
      draftAllocations.map((draft) => [cellKey(draft.employeeId, draft.orderId), draft]),
    );
    const manualDraftKeys = new Set(
      draftAllocations
        .filter((draft) => draft.bonusEntryId == null)
        .map((draft) => cellKey(draft.employeeId, draft.orderId)),
    );

    const draftBonusesByEmployee = new Map<string, Decimal>();
    if (DRAFT_PREVIEW_STATUSES.has(run.status)) {
      for (const draft of draftAllocations) {
        const current = draftBonusesByEmployee.get(draft.employeeId) ?? BONUS_POOL_ZERO;
        draftBonusesByEmployee.set(draft.employeeId, current.plus(decimalFrom(draft.amount)));
      }
    }

    const employeeRows = run.salaryLines.map((line) => {
      const baseSalary = decimalFrom(line.baseSalary);
      const bonusesTotal =
        draftBonusesByEmployee.get(line.employee.id) ?? decimalFrom(line.bonusesTotal);
      return {
        id: line.employee.id,
        employeeId: line.employee.id,
        firstName: line.employee.firstName,
        lastName: line.employee.lastName,
        position: line.employee.position,
        baseSalary: baseSalary.toFixed(2),
        salaryLineId: line.id,
        bonusTotalThisRun: bonusesTotal.toFixed(2),
        payableTotal: baseSalary.plus(bonusesTotal).toFixed(2),
      };
    });

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
        const key = cellKey(emp.employeeId, unit.orderId);
        const linked = linkedIds.has(emp.employeeId) || manualDraftKeys.has(key);
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
        const draft = draftByCell.get(key);
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
        const releaseThisMonth =
          DRAFT_PREVIEW_STATUSES.has(run.status) && draft
            ? decimalFrom(draft.amount)
            : thisRunRelease
              ? decimalFrom(thisRunRelease.payrollIncludedAmount ?? thisRunRelease.amount)
              : BONUS_POOL_ZERO;
        const pool = unitByOrderId.get(unit.orderId);
        const availableFunding = pool ? decimalFrom(pool.availableFunding) : BONUS_POOL_ZERO;
        const manualBonus =
          draft?.bonusEntryId == null && draft != null
            ? true
            : entry != null &&
              entry.dealId == null &&
              entry.salesAccrualInvoiceId == null &&
              entry.calculationSnapshot == null;
        const state = resolvePayrollMatrixCellState({
          linked,
          hasBonusEntry: entry != null,
          releaseAmount: releaseThisMonth,
          remaining,
          availableFunding,
          deliveryOpen: unit.deliveryOpen,
          manualBonus,
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

    const draftBonusTotal = DRAFT_PREVIEW_STATUSES.has(run.status)
      ? sumMoney(cells.map((cell) => cell.releaseThisMonth))
      : decimalFrom(run.totalBonuses);
    const totalBaseSalary = decimalFrom(run.totalBaseSalary);
    const totalPaid = decimalFrom(run.totalPaid);
    const totalPayable = totalBaseSalary.plus(draftBonusTotal);

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
        totalBaseSalary: totalBaseSalary.toFixed(2),
        totalBonuses: draftBonusTotal.toFixed(2),
        totalPayable: totalPayable.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalRemaining: totalPayable.minus(totalPaid).toFixed(2),
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
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      select: { id: true, status: true, payrollMonth: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE_STATUSES.has(run.status)) {
      throw new BadRequestException('Payroll matrix draft can only be edited while run is DRAFT');
    }

    const amount = decimalFrom(body.releaseThisMonth);
    const releaseAmount = amount.lt(BONUS_POOL_ZERO) ? BONUS_POOL_ZERO : amount;
    if (releaseAmount.lte(BONUS_POOL_ZERO)) {
      await this.prisma.payrollBonusAllocationDraft.deleteMany({
        where: { payrollRunId, employeeId: body.employeeId, orderId: body.orderId },
      });
      return this.getMatrix(payrollRunId, userId);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        projectId: true,
        product: { select: { status: true } },
        extension: { select: { status: true } },
        productBonusPool: { select: { availableFunding: true } },
        bonusEntries: {
          where: { employeeId: body.employeeId },
          select: {
            id: true,
            employeeId: true,
            type: true,
            amount: true,
            payableAmount: true,
            earnedPeriod: true,
            dealId: true,
            salesAccrualInvoiceId: true,
            calculationSnapshot: true,
          },
        },
      },
    });
    if (!order) throw new BadRequestException('Delivery unit not found');

    const entry =
      order.bonusEntries.find((b) => isPayrollMatrixBonusEntryVisible(b, run.payrollMonth)) ?? null;
    if (!entry) {
      throw new BadRequestException(
        'No bonus entry for this employee and delivery unit. Create a manual bonus first.',
      );
    }

    const entryReleases = await this.prisma.bonusRelease.findMany({
      where: {
        bonusEntryId: entry.id,
        status: { in: ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] },
      },
      select: {
        payrollRunId: true,
        status: true,
        amount: true,
        payrollIncludedAmount: true,
      },
    });
    const releasedBefore = sumBonusEntryReleasedBefore(entryReleases, payrollRunId);
    const releaseBase = payrollBonusReleaseBase(
      {
        type: entry.type,
        amount: entry.amount,
        payableAmount: entry.payableAmount,
        earnedPeriod: entry.earnedPeriod,
      },
      run.payrollMonth,
    );
    const remaining = Decimal.max(BONUS_POOL_ZERO, releaseBase.minus(releasedBefore));
    const availableFunding = order.productBonusPool
      ? decimalFrom(order.productBonusPool.availableFunding)
      : BONUS_POOL_ZERO;
    const deliveryOpen =
      (order.product?.status != null &&
        !['DONE', 'LOST', 'TRANSFER'].includes(order.product.status)) ||
      (order.extension?.status != null &&
        !['DONE', 'LOST', 'TRANSFER'].includes(order.extension.status));
    const manualBonus =
      entry.dealId == null &&
      entry.salesAccrualInvoiceId == null &&
      entry.calculationSnapshot == null;
    const state = resolvePayrollMatrixCellState({
      linked: true,
      hasBonusEntry: true,
      releaseAmount,
      remaining,
      availableFunding,
      deliveryOpen,
      manualBonus,
    });

    await this.prisma.payrollBonusAllocationDraft.upsert({
      where: {
        payrollRunId_employeeId_orderId: {
          payrollRunId,
          employeeId: body.employeeId,
          orderId: body.orderId,
        },
      },
      create: {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        projectId: order.projectId,
        bonusEntryId: entry.id,
        amount: releaseAmount,
        kind: allocationKindFromCellState(state),
        reason: body.reason?.trim() || null,
        createdById: userId,
        updatedById: userId,
      },
      update: {
        bonusEntryId: entry.id,
        projectId: order.projectId,
        amount: releaseAmount,
        kind: allocationKindFromCellState(state),
        reason: body.reason?.trim() || null,
        updatedById: userId,
      },
    });

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
    if (amount.lte(BONUS_POOL_ZERO)) {
      throw new BadRequestException('Manual bonus amount must be greater than zero');
    }

    await this.prisma.payrollBonusAllocationDraft.upsert({
      where: {
        payrollRunId_employeeId_orderId: {
          payrollRunId,
          employeeId: body.employeeId,
          orderId: body.orderId,
        },
      },
      create: {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        projectId: order.projectId,
        bonusEntryId: null,
        amount,
        kind: 'MANUAL_BONUS',
        title: body.title.trim(),
        reason: body.reason.trim(),
        createdById: userId,
        updatedById: userId,
      },
      update: {
        bonusEntryId: null,
        amount,
        kind: 'MANUAL_BONUS',
        title: body.title.trim(),
        reason: body.reason.trim(),
        updatedById: userId,
      },
    });

    return this.getMatrix(payrollRunId, userId);
  }
}
