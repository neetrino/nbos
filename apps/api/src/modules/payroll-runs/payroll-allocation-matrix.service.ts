import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal, PayrollMatrixViewModeEnum, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { hasCallerPermission } from '../../common/authorization/caller-permission';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import {
  FINANCE_BONUSES_MODULE,
  assertEmployeeAccessible,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';
import {
  assertPayrollWriteAccess,
  filterSalaryLinesByAccess,
  resolvePayrollReadAccess,
} from './payroll-run-access';
import {
  validatePayrollMatrixForApproval,
  type PayrollMatrixValidationIssue,
} from './payroll-matrix-approval-validation';
import {
  DELIVERY_ROLE_PRODUCT_SELECT,
  linkedEmployeeIdsForUnit,
  resolveDeliveryPayableUnits,
} from './delivery-payable-unit.resolver';
import {
  queryPayrollEmployeeBonusHistoryMeta,
  queryPayrollEmployeeBonusHistorySlice,
} from './payroll-employee-bonus-history';
import type {
  PayrollEmployeeBonusHistoryMetaDto,
  PayrollEmployeeBonusHistorySliceDto,
} from './payroll-employee-bonus-history.types';
import { isPayrollMatrixBonusEntryVisible } from './payroll-bonus-release-base';
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
} from './payroll-allocation-matrix.types';
import { payrollAllocationReasonRequired } from './payroll-allocation-exception-reason';
import { resolvePayrollMatrixCellState } from './payroll-allocation-matrix-cell-state';
import {
  aggregatePayrollMatrixCellSources,
  payrollMatrixCellIsManualBonus,
  type PayrollMatrixCellSourceAggregate,
} from './payroll-allocation-matrix-cell-sources';
import { writePayrollMatrixCellDraft } from './payroll-allocation-matrix-cell-write';
import { appendAccessibleBonusOnlyPayees } from './payroll-allocation-matrix-unpaid-payees';

export { resolvePayrollMatrixCellState } from './payroll-allocation-matrix-cell-state';

const EDITABLE_STATUSES = new Set(['DRAFT']);
const DRAFT_PREVIEW_STATUSES = new Set(['DRAFT', 'REVIEW']);

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
}

function sumMoney(values: string[]): Decimal {
  return values.reduce((sum, value) => sum.plus(decimalFrom(value)), BONUS_POOL_ZERO);
}

function assemblePayrollAllocationMatrixCell(params: {
  employeeId: string;
  orderId: string;
  linked: boolean;
  sources: PayrollMatrixCellSourceAggregate;
  draft: { bonusEntryId: string | null; kind: string } | undefined;
  releaseThisMonth: Decimal;
  availableFunding: Decimal;
  deliveryOpen: boolean;
  runEditable: boolean;
}): PayrollAllocationMatrixCell {
  const entry = params.sources.firstEntry;
  const state = resolvePayrollMatrixCellState({
    linked: params.linked,
    hasBonusEntry: entry != null,
    releaseAmount: params.releaseThisMonth,
    remaining: params.sources.remaining,
    availableFunding: params.availableFunding,
    deliveryOpen: params.deliveryOpen,
    manualBonus: payrollMatrixCellIsManualBonus(params.sources.visibleEntries, params.draft),
  });
  return {
    employeeId: params.employeeId,
    orderId: params.orderId,
    state,
    linked: params.linked,
    bonusTitle: entry?.title ?? null,
    bonusEntryId: entry?.id ?? null,
    sourceEntries: params.sources.sourceEntries,
    bonusReleaseId: params.sources.thisRunReleaseId,
    plannedAmount: params.sources.planned.toFixed(2),
    originalAmount: params.sources.original?.toFixed(2) ?? null,
    currentAmount: params.sources.planned.toFixed(2),
    releasedBefore: params.sources.releasedBefore.toFixed(2),
    paidBefore: params.sources.paidBefore.toFixed(2),
    remaining: params.sources.remaining.toFixed(2),
    suggestedThisMonth: params.sources.remaining.toFixed(2),
    releaseThisMonth: params.releaseThisMonth.toFixed(2),
    warning:
      state === 'OVER_FUNDING' ? 'Over funding' : state === 'EXTRA_BONUS' ? 'Extra bonus' : null,
    reasonRequired:
      payrollAllocationReasonRequired(state, entry?.type) ||
      payrollAllocationReasonRequired(params.draft?.kind ?? '', entry?.type),
    bonusType: entry?.type ?? null,
    editable: params.runEditable && (params.linked || state !== 'UNLINKED'),
  };
}

@Injectable()
export class PayrollAllocationMatrixService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getValidation(
    payrollRunId: string,
    actor: FinancePayActor,
  ): Promise<{ issues: PayrollMatrixValidationIssue[] }> {
    await resolvePayrollReadAccess(this.prisma, actor);
    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    const issues = await validatePayrollMatrixForApproval(this.prisma, payrollRunId);
    return { issues };
  }

  async getMatrix(
    payrollRunId: string,
    actor: FinancePayActor,
    viewMode: PayrollMatrixViewModeEnum = 'EMPLOYEE_MATRIX',
  ): Promise<PayrollAllocationMatrixDto> {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    const userId = actor.id;
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
    const salaryLines = filterSalaryLinesByAccess(run.salaryLines, accessible);

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
        product: { select: DELIVERY_ROLE_PRODUCT_SELECT },
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
          select: {
            id: true,
            employeeId: true,
            orderId: true,
            amount: true,
            originalAmount: true,
          },
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

    const salaryEmployeeRows = salaryLines.map((line) => {
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
    const employeeRows = await appendAccessibleBonusOnlyPayees({
      findEmployees: (ids) =>
        this.prisma.employee.findMany({
          where: { id: { in: ids } },
          select: { id: true, firstName: true, lastName: true, position: true },
        }),
      rows: salaryEmployeeRows,
      entries: orders.flatMap((order) => order.bonusEntries),
      releases: releases.map((release) => ({
        ...release,
        bonusEntryId: release.bonusEntry.id,
      })),
      payrollMonth: run.payrollMonth,
      payrollRunId,
      draftEmployeeIds: draftAllocations.map((draft) => draft.employeeId),
      draftBonusesByEmployee,
      accessible,
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
        const linkedIds = order
          ? linkedEmployeeIdsForUnit({
              product: order.product,
              bonusEmployeeIds: order.bonusEntries
                .filter((b) => isPayrollMatrixBonusEntryVisible(b, run.payrollMonth))
                .map((b) => b.employeeId),
            })
          : new Set<string>();
        const key = cellKey(emp.employeeId, unit.orderId);
        const linked = linkedIds.has(emp.employeeId) || manualDraftKeys.has(key);
        const orderReleases = releases.filter(
          (r) =>
            r.bonusEntry.employeeId === emp.employeeId && r.bonusEntry.orderId === unit.orderId,
        );
        const sources = aggregatePayrollMatrixCellSources({
          entries: order?.bonusEntries ?? [],
          employeeId: emp.employeeId,
          payrollMonth: run.payrollMonth,
          payrollRunId,
          releases: orderReleases.map((release) => ({
            ...release,
            bonusEntryId: release.bonusEntry.id,
          })),
        });
        const draft = draftByCell.get(key);
        const pool = unitByOrderId.get(unit.orderId);
        cells.push(
          assemblePayrollAllocationMatrixCell({
            employeeId: emp.employeeId,
            orderId: unit.orderId,
            linked,
            sources,
            draft,
            releaseThisMonth:
              DRAFT_PREVIEW_STATUSES.has(run.status) && draft
                ? decimalFrom(draft.amount)
                : sources.thisRunReleaseAmount,
            availableFunding: pool ? decimalFrom(pool.availableFunding) : BONUS_POOL_ZERO,
            deliveryOpen: unit.deliveryOpen,
            runEditable: editable,
          }),
        );
      }
    }

    const draftBonusTotal = DRAFT_PREVIEW_STATUSES.has(run.status)
      ? sumMoney(cells.map((cell) => cell.releaseThisMonth))
      : accessible === 'ALL'
        ? decimalFrom(run.totalBonuses)
        : sumMoney(employeeRows.map((row) => row.bonusTotalThisRun));
    const totalBaseSalary =
      accessible === 'ALL'
        ? decimalFrom(run.totalBaseSalary)
        : sumMoney(employeeRows.map((row) => row.baseSalary));
    const totalPaid =
      accessible === 'ALL'
        ? decimalFrom(run.totalPaid)
        : sumMoney(salaryLines.map((line) => decimalFrom(line.paidAmount).toFixed(2)));
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
    actor: FinancePayActor,
    body: PatchPayrollMatrixLayoutBody,
  ): Promise<PayrollAllocationMatrixDto> {
    assertPayrollWriteAccess(actor, 'EDIT');
    await savePayrollMatrixLayout(this.prisma, actor.id, payrollRunId, body.viewMode, {
      rowOrder: body.rowOrder,
      columnOrder: body.columnOrder,
      pinnedUnitIds: body.pinnedUnitIds,
    });
    return this.getMatrix(payrollRunId, actor, body.viewMode);
  }

  async patchCell(
    payrollRunId: string,
    actor: FinancePayActor,
    body: PatchPayrollMatrixCellBody,
  ): Promise<PayrollAllocationMatrixDto> {
    assertPayrollWriteAccess(actor, 'EDIT');
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
      return this.getMatrix(payrollRunId, actor);
    }

    await writePayrollMatrixCellDraft(this.prisma, {
      payrollRunId,
      payrollMonth: run.payrollMonth,
      employeeId: body.employeeId,
      orderId: body.orderId,
      userId: actor.id,
      releaseAmount,
      reason: body.reason,
      sourceAmounts: body.sourceAmounts,
    });
    return this.getMatrix(payrollRunId, actor);
  }

  async resetLayout(
    payrollRunId: string,
    actor: FinancePayActor,
    viewMode: PayrollMatrixViewModeEnum,
  ): Promise<PayrollAllocationMatrixDto> {
    assertPayrollWriteAccess(actor, 'EDIT');
    await savePayrollMatrixLayout(this.prisma, actor.id, payrollRunId, viewMode, {
      rowOrder: [],
      columnOrder: [],
      pinnedUnitIds: [],
    });
    return this.getMatrix(payrollRunId, actor, viewMode);
  }

  async createManualBonus(
    payrollRunId: string,
    actor: FinancePayActor,
    body: CreatePayrollMatrixManualBonusBody,
  ): Promise<PayrollAllocationMatrixDto> {
    assertPayrollWriteAccess(actor, 'EDIT');
    if (!hasCallerPermission(actor.permissions, FINANCE_BONUSES_MODULE, 'ADD')) {
      throw new ForbiddenException(`No permission: ${FINANCE_BONUSES_MODULE}.ADD`);
    }
    const userId = actor.id;
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

    return this.getMatrix(payrollRunId, actor);
  }

  private async resolveHistoryDeliveryUnits(
    payrollRunId: string,
    userId: string,
  ): Promise<Awaited<ReturnType<typeof resolveDeliveryPayableUnits>>> {
    const layout = await loadPayrollMatrixLayout(
      this.prisma,
      userId,
      payrollRunId,
      'EMPLOYEE_MATRIX',
    );
    return resolveDeliveryPayableUnits(this.prisma, payrollRunId, layout.pinnedUnitIds);
  }

  async getEmployeeBonusHistoryMeta(
    payrollRunId: string,
    actor: FinancePayActor,
  ): Promise<PayrollEmployeeBonusHistoryMetaDto> {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    const deliveryUnits = await this.resolveHistoryDeliveryUnits(payrollRunId, actor.id);
    const meta = await queryPayrollEmployeeBonusHistoryMeta(
      this.prisma,
      payrollRunId,
      deliveryUnits,
    );
    if (accessible === 'ALL') return meta;
    return {
      ...meta,
      employees: meta.employees.filter((employee) => accessible.includes(employee.employeeId)),
    };
  }

  async getEmployeeBonusHistorySlice(
    payrollRunId: string,
    actor: FinancePayActor,
    employeeId: string,
  ): Promise<PayrollEmployeeBonusHistorySliceDto> {
    const accessible = await resolvePayrollReadAccess(this.prisma, actor);
    assertEmployeeAccessible(employeeId, accessible);
    const deliveryUnits = await this.resolveHistoryDeliveryUnits(payrollRunId, actor.id);
    return queryPayrollEmployeeBonusHistorySlice(
      this.prisma,
      payrollRunId,
      employeeId,
      deliveryUnits,
    );
  }
}
