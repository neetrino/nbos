import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type Prisma,
  type ExpenseBacklogReasonEnum,
  type ExpenseTypeEnum,
  type ExpenseCategoryEnum,
  ExpenseStatusEnum,
  type ExpenseFrequency,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import {
  pickExpenseBacklogReasonFilter,
  pickExpenseCategoryFilter,
  pickExpenseFrequencyFilter,
  pickExpenseStatusFilter,
  pickExpenseTypeFilter,
} from './expense-query-enum-guards';
import {
  requireExpenseCategory,
  requireExpenseCategoryIfPresent,
  requireExpenseFrequencyIfPresent,
  requireExpenseStatusIfPresent,
  requireExpenseType,
  requireExpenseTypeIfPresent,
  requireTaxStatusIfPresent,
  parseExpenseBacklogReasonField,
  resolveExpenseFrequency,
  resolveExpenseStatus,
  resolveExpenseTaxStatus,
} from './expense-mutation-enum-validators';
import { normalizeExpenseListPage, normalizeExpenseListPageSize } from './expenses-list-pagination';
import { fetchExpenseStatsAggregates } from './expense-stats-aggregates';
import { createExpensePaymentRecord, type AddExpensePaymentInput } from './expense-payment-create';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { toExpenseLedgerJson } from './expense-detail-mapper';
import { applyPayrollExpenseListScope } from './expense-payroll-list-scope';
import { mapSalaryLineToLinkedPayrollRun } from './expense-payroll-link-map';
import { mapExpensePlanToLinkedPlan } from './expense-plan-link-map';
import {
  attachLedgerFieldsToExpenseListItems,
  fetchExpensePaidTotalsByExpenseIds,
} from './expense-list-ledger';
import { assertExpenseAmountCoversRecordedPayments } from './expense-amount-update-guard';
import { syncExpenseStatusWithPaymentLedger } from './expense-status-ledger-sync';
import {
  refreshExpenseWorkflowStatus,
  EXPENSE_BOARD_SCOPE_EXCLUDE,
  EXPENSE_CLOSED_SCOPE_STATUSES,
} from './expense-workflow';
import { OperationalJournalService } from '../finance/journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import { mergeFinanceWhere } from '../finance/finance-scoped-access';
import { assertExpenseAccessible } from './expense-access.op';
import { resolveExpenseListParticipationWhere } from './expense-list-participation.op';
import type {
  CreateExpenseDto,
  ExpenseQueryParams,
  ExpenseStatsParams,
  UpdateExpenseDto,
} from './expense-service.types';

const EXPENSE_LIST_SORT_FIELDS = new Set(['createdAt', 'dueDate', 'amount', 'name', 'status']);

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly operationalJournal: OperationalJournalService,
  ) {}

  async findAll(params: ExpenseQueryParams) {
    const {
      page: pageIn,
      pageSize: pageSizeIn,
      type,
      category,
      status,
      backlogReason,
      projectId,
      expensePlanId,
      frequency,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      activeBoard,
      closedBoard,
      payrollLinked,
      payrollMonth,
      payrollEmployeeId,
    } = params;

    const page = normalizeExpenseListPage(pageIn);
    const pageSize = normalizeExpenseListPageSize(pageSizeIn);

    const orderBy = this.buildExpenseListOrderBy(sortBy, sortOrder);

    const safeType = pickExpenseTypeFilter(type);
    const safeCategory = pickExpenseCategoryFilter(category);
    const safeStatus = pickExpenseStatusFilter(status);
    const safeFrequency = pickExpenseFrequencyFilter(frequency);
    const safeBacklogReason = pickExpenseBacklogReasonFilter(backlogReason);

    const baseWhere = this.buildWhere({
      type: safeType,
      category: safeCategory,
      status: safeStatus,
      backlogReason: safeBacklogReason,
      projectId,
      expensePlanId,
      frequency: safeFrequency,
      search,
      dateFrom,
      dateTo,
      activeBoard: activeBoard === true,
      closedBoard: closedBoard === true,
      payrollLinked: payrollLinked === true,
      payrollMonth,
      payrollEmployeeId,
    });
    const participationWhere = await resolveExpenseListParticipationWhere(
      this.prisma,
      params.access,
      { payrollLinked, payrollMonth, payrollEmployeeId },
    );
    const where = mergeFinanceWhere(baseWhere, participationWhere);

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          expensePlan: { select: { id: true, name: true } },
          salaryLine: {
            select: {
              id: true,
              payrollRunId: true,
              payrollRun: { select: { payrollMonth: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);

    const ids = items.map((row) => row.id);
    const paidTotals = await fetchExpensePaidTotalsByExpenseIds(this.prisma, ids);
    const withLedger = attachLedgerFieldsToExpenseListItems(items, paidTotals);
    const enrichedItems = withLedger.map((row) => {
      const { salaryLine, expensePlan, ...rest } = row;
      return {
        ...rest,
        status: refreshExpenseWorkflowStatus(rest.status, rest.dueDate),
        linkedPayrollRun: mapSalaryLineToLinkedPayrollRun(salaryLine),
        linkedExpensePlan: mapExpensePlanToLinkedPlan(expensePlan),
      };
    });

    return {
      items: enrichedItems,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string, access?: ExpenseQueryParams['access']) {
    await assertExpenseAccessible(this.prisma, id, access);
    const row = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        expensePlan: { select: { id: true, name: true } },
        expensePayments: { orderBy: { paymentDate: 'desc' } },
        salaryLine: {
          select: {
            id: true,
            payrollRunId: true,
            payrollRun: { select: { payrollMonth: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException(`Expense ${id} not found`);
    const { salaryLine, expensePlan, ...expense } = row;
    const presentedStatus = refreshExpenseWorkflowStatus(expense.status, expense.dueDate);
    const ledger = toExpenseLedgerJson({ ...expense, status: presentedStatus });
    return {
      ...ledger,
      linkedPayrollRun: mapSalaryLineToLinkedPayrollRun(salaryLine),
      linkedExpensePlan: mapExpensePlanToLinkedPlan(expensePlan),
    };
  }

  async addPayment(
    id: string,
    input: AddExpensePaymentInput,
    access?: ExpenseQueryParams['access'],
  ) {
    await assertExpenseAccessible(this.prisma, id, access);
    await createExpensePaymentRecord(this.prisma, id, input, {
      notify: this.notifications,
      journal: this.operationalJournal,
    });
    return this.findById(id, access);
  }

  async deletePayment(expenseId: string, paymentId: string, access?: ExpenseQueryParams['access']) {
    await assertExpenseAccessible(this.prisma, expenseId, access);
    const row = await this.prisma.expensePayment.findFirst({
      where: { id: paymentId, expenseId },
    });
    if (!row) {
      throw new NotFoundException(`Expense payment ${paymentId} not found`);
    }
    await assertPostingPeriodOpenForBookedAt(this.prisma, row.paymentDate);
    await this.prisma.expensePayment.delete({ where: { id: paymentId } });
    await syncExpenseStatusWithPaymentLedger(this.prisma, expenseId);
    await syncSalaryLinePaidFromExpenseLedger(this.prisma, expenseId, this.notifications);
    return this.findById(expenseId, access);
  }

  async create(data: CreateExpenseDto, access?: ExpenseQueryParams['access']) {
    if (data.expensePlanId) {
      const plan = await this.prisma.expensePlan.findUnique({
        where: { id: data.expensePlanId },
        select: { id: true, projectId: true },
      });
      if (!plan) {
        throw new BadRequestException('Expense plan not found');
      }
      if (data.projectId && plan.projectId && data.projectId !== plan.projectId) {
        throw new BadRequestException('Project does not match the selected expense plan');
      }
    }

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    const requestedStatus = resolveExpenseStatus(data.status) as ExpenseStatusEnum;
    const workflowStatus = refreshExpenseWorkflowStatus(requestedStatus, dueDate ?? null);

    const bookedAt = dueDate ?? new Date();
    await assertPostingPeriodOpenForBookedAt(this.prisma, bookedAt);

    const created = await this.prisma.expense.create({
      data: {
        name: data.name,
        type: requireExpenseType(data.type) as ExpenseTypeEnum,
        category: requireExpenseCategory(data.category) as ExpenseCategoryEnum,
        amount: data.amount,
        frequency: resolveExpenseFrequency(data.frequency) as ExpenseFrequency,
        dueDate,
        status: workflowStatus,
        projectId: data.projectId,
        ...(data.expensePlanId ? { expensePlanId: data.expensePlanId } : {}),
        ...(data.clientServiceRecordId
          ? { clientServiceRecordId: data.clientServiceRecordId }
          : {}),
        isPassThrough: data.isPassThrough ?? false,
        taxStatus: resolveExpenseTaxStatus(
          data.taxStatus,
        ) as Prisma.ExpenseCreateInput['taxStatus'],
        ...(data.backlogReason !== undefined && {
          backlogReason: parseExpenseBacklogReasonField(
            data.backlogReason,
          ) as ExpenseBacklogReasonEnum | null,
        }),
        notes: data.notes,
      },
    });

    await this.operationalJournal.appendExpenseCardAccrualLine({
      expenseId: created.id,
      expenseName: created.name,
      amount: new Decimal(created.amount).toNumber(),
      bookedAt,
      projectId: created.projectId,
    });

    return this.findById(created.id, access);
  }

  async update(id: string, data: UpdateExpenseDto, access?: ExpenseQueryParams['access']) {
    await assertExpenseAccessible(this.prisma, id, access);
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      select: { dueDate: true },
    });
    if (!existing) {
      throw new NotFoundException(`Expense ${id} not found`);
    }

    const typePatch = data.type !== undefined ? requireExpenseTypeIfPresent(data.type) : undefined;
    const categoryPatch =
      data.category !== undefined ? requireExpenseCategoryIfPresent(data.category) : undefined;
    const frequencyPatch =
      data.frequency !== undefined ? requireExpenseFrequencyIfPresent(data.frequency) : undefined;
    const statusPatch =
      data.status !== undefined ? requireExpenseStatusIfPresent(data.status) : undefined;
    const taxStatusPatch =
      data.taxStatus !== undefined ? requireTaxStatusIfPresent(data.taxStatus) : undefined;
    const backlogReasonPatch =
      data.backlogReason !== undefined
        ? parseExpenseBacklogReasonField(data.backlogReason)
        : undefined;

    if (data.amount !== undefined) {
      await assertExpenseAmountCoversRecordedPayments(this.prisma, id, new Decimal(data.amount));
    }

    const bookedAtForGuard =
      data.dueDate !== undefined
        ? data.dueDate
          ? new Date(data.dueDate)
          : new Date()
        : (existing.dueDate ?? new Date());
    await assertPostingPeriodOpenForBookedAt(this.prisma, bookedAtForGuard);

    await this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(typePatch !== undefined && { type: typePatch as ExpenseTypeEnum }),
        ...(categoryPatch !== undefined && { category: categoryPatch as ExpenseCategoryEnum }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(frequencyPatch !== undefined && { frequency: frequencyPatch as ExpenseFrequency }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(statusPatch !== undefined && { status: statusPatch as ExpenseStatusEnum }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.clientServiceRecordId !== undefined && {
          clientServiceRecordId: data.clientServiceRecordId || null,
        }),
        ...(data.isPassThrough !== undefined && { isPassThrough: data.isPassThrough }),
        ...(taxStatusPatch !== undefined && {
          taxStatus: taxStatusPatch as Prisma.ExpenseUpdateInput['taxStatus'],
        }),
        ...(backlogReasonPatch !== undefined && {
          backlogReason: backlogReasonPatch as ExpenseBacklogReasonEnum | null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
    if (statusPatch === undefined) {
      await this.persistRefreshedWorkflowStatus(id);
    }
    if (data.amount !== undefined) {
      await syncExpenseStatusWithPaymentLedger(this.prisma, id);
    }
    return this.findById(id, access);
  }

  async delete(id: string, access?: ExpenseQueryParams['access']) {
    await assertExpenseAccessible(this.prisma, id, access);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getStats(params: ExpenseStatsParams = {}) {
    const safeStatus = pickExpenseStatusFilter(params.status);
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const projectWhere = params.projectId ? { projectId: params.projectId } : {};
    const planIdTrimmed = params.expensePlanId?.trim();
    const planWhere = planIdTrimmed ? { expensePlanId: planIdTrimmed } : {};
    const statusWhere = safeStatus
      ? { status: safeStatus as ExpenseStatusEnum }
      : params.closedBoard === true
        ? { status: { in: EXPENSE_CLOSED_SCOPE_STATUSES } }
        : params.activeBoard === true
          ? {
              status: {
                notIn: EXPENSE_BOARD_SCOPE_EXCLUDE,
              },
            }
          : {};

    const scopeWhere: Prisma.ExpenseWhereInput = {
      ...projectWhere,
      ...planWhere,
      ...statusWhere,
      ...(createdAt ? { createdAt } : {}),
    };
    applyPayrollExpenseListScope(scopeWhere, {
      payrollLinked: params.payrollLinked === true,
      payrollMonth: params.payrollMonth,
      payrollEmployeeId: params.payrollEmployeeId,
    });
    const participationWhere = await resolveExpenseListParticipationWhere(
      this.prisma,
      params.access,
      {
        payrollLinked: params.payrollLinked === true,
        payrollMonth: params.payrollMonth,
        payrollEmployeeId: params.payrollEmployeeId,
      },
    );
    const statsWhere = mergeFinanceWhere(scopeWhere, participationWhere);

    return fetchExpenseStatsAggregates(this.prisma, statsWhere);
  }

  private async persistRefreshedWorkflowStatus(id: string): Promise<void> {
    const row = await this.prisma.expense.findUnique({
      where: { id },
      select: { status: true, dueDate: true },
    });
    if (!row) return;
    const next = refreshExpenseWorkflowStatus(row.status, row.dueDate);
    if (next !== row.status) {
      await this.prisma.expense.update({ where: { id }, data: { status: next } });
    }
  }

  private buildExpenseListOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Prisma.ExpenseOrderByWithRelationInput {
    const field = sortBy && EXPENSE_LIST_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: order };
  }

  private buildWhere(
    filters: Omit<ExpenseQueryParams, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};
    if (filters.type) where.type = filters.type as ExpenseTypeEnum;
    if (filters.category) where.category = filters.category as ExpenseCategoryEnum;
    if (filters.status) {
      where.status = filters.status as ExpenseStatusEnum;
    } else if (filters.closedBoard) {
      where.status = { in: EXPENSE_CLOSED_SCOPE_STATUSES };
    } else if (filters.activeBoard) {
      where.status = {
        notIn: EXPENSE_BOARD_SCOPE_EXCLUDE,
      };
    }
    if (filters.backlogReason) {
      where.backlogReason = filters.backlogReason as ExpenseBacklogReasonEnum;
    }
    if (filters.projectId) where.projectId = filters.projectId;
    const planId = filters.expensePlanId?.trim();
    if (planId) where.expensePlanId = planId;
    if (filters.frequency) where.frequency = filters.frequency as ExpenseFrequency;
    const searchTrimmed = filters.search?.trim();
    if (searchTrimmed) {
      const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { name: ic },
            { notes: ic },
            { project: { name: ic } },
            { project: { code: ic } },
            { expensePlan: { name: ic } },
            { expensePlan: { provider: ic } },
          ],
        },
      ];
    }
    const createdAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }
    applyPayrollExpenseListScope(where, {
      payrollLinked: filters.payrollLinked === true,
      payrollMonth: filters.payrollMonth,
      payrollEmployeeId: filters.payrollEmployeeId,
    });
    return where;
  }

  private buildDateRange(dateFrom?: string, dateTo?: string): Prisma.DateTimeFilter | undefined {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
}
