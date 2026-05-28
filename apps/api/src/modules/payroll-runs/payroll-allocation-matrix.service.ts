import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Decimal, PayrollMatrixViewModeEnum, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { applyMatrixCellPatch, syncAfterMatrixReleaseMutation } from './payroll-matrix-cell-patch';
import { resolveDeliveryPayableUnits } from './delivery-payable-unit.resolver';
import {
  applyCustomOrder,
  loadPayrollMatrixLayout,
  savePayrollMatrixLayout,
} from './payroll-matrix-layout';
import type {
  CreatePayrollMatrixManualBonusBody,
  PatchPayrollMatrixCellBody,
  PatchPayrollMatrixLayoutBody,
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
  if (params.releaseType === 'OVER_FUNDING' || params.releaseAmount.gt(params.availableFunding)) {
    return 'OVER_FUNDING';
  }
  if (params.releaseType === 'EXTRA' || params.releaseAmount.gt(params.remaining)) {
    return 'EXTRA_BONUS';
  }
  if (params.manual || params.releaseType === 'MANUAL' || params.releaseType === 'EARLY') {
    return 'MANUAL';
  }
  return 'RELEASE_SET';
}

@Injectable()
export class PayrollAllocationMatrixService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

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
          select: { id: true, employeeId: true, amount: true, originalAmount: true, status: true },
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
          order.bonusEntries.forEach((b) => linkedIds.add(b.employeeId));
          if (order.product?.pmId) linkedIds.add(order.product.pmId);
          if (order.product?.developerId) linkedIds.add(order.product.developerId);
          if (order.product?.designerId) linkedIds.add(order.product.designerId);
        }
        const linked = linkedIds.has(emp.employeeId);
        const entry = order?.bonusEntries.find((b) => b.employeeId === emp.employeeId);
        const entryReleases = releases.filter(
          (r) =>
            r.bonusEntry.employeeId === emp.employeeId && r.bonusEntry.orderId === unit.orderId,
        );
        const thisRunRelease = entryReleases.find(
          (r) => r.payrollRunId === payrollRunId && r.status === 'INCLUDED_IN_PAYROLL',
        );
        const releasedBefore = entryReleases
          .filter((r) => r.payrollRunId !== payrollRunId || r.status === 'PAID')
          .reduce(
            (s, r) => s.plus(decimalFrom(r.payrollIncludedAmount ?? r.amount)),
            BONUS_POOL_ZERO,
          );
        const paidBefore = entryReleases
          .filter((r) => r.status === 'PAID')
          .reduce(
            (s, r) => s.plus(decimalFrom(r.payrollIncludedAmount ?? r.amount)),
            BONUS_POOL_ZERO,
          );
        const planned = entry ? decimalFrom(entry.amount) : BONUS_POOL_ZERO;
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
          reasonRequired: state === 'OVER_FUNDING' || state === 'EXTRA_BONUS',
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
    if (amount.lt(BONUS_POOL_ZERO)) {
      const touched = await this.prisma.$transaction((tx) =>
        applyMatrixCellPatch(tx, {
          payrollRunId,
          employeeId: body.employeeId,
          orderId: body.orderId,
          releaseAmount: BONUS_POOL_ZERO,
          reason: body.reason,
          approvedById: userId,
        }),
      );
      await syncAfterMatrixReleaseMutation(this.prisma, touched, this.notifications);
      return this.getMatrix(payrollRunId, userId);
    }

    const touched = await this.prisma.$transaction((tx) =>
      applyMatrixCellPatch(tx, {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        releaseAmount: amount,
        reason: body.reason,
        approvedById: userId,
      }),
    );
    await syncAfterMatrixReleaseMutation(this.prisma, touched, this.notifications);

    return this.getMatrix(payrollRunId, userId);
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
    await this.prisma.bonusEntry.create({
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

    const touched = await this.prisma.$transaction((tx) =>
      applyMatrixCellPatch(tx, {
        payrollRunId,
        employeeId: body.employeeId,
        orderId: body.orderId,
        releaseAmount: amount,
        reason: body.reason,
        approvedById: userId,
      }),
    );
    await syncAfterMatrixReleaseMutation(this.prisma, touched, this.notifications);

    return this.getMatrix(payrollRunId, userId);
  }
}
