import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ExpenseTypeEnum,
  type ExpenseCategoryEnum,
  type ExpenseStatusEnum,
  type ExpenseFrequency,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
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
  resolveExpenseFrequency,
  resolveExpenseStatus,
  resolveExpenseTaxStatus,
} from './expense-mutation-enum-validators';
import { normalizeExpenseListPage, normalizeExpenseListPageSize } from './expenses-list-pagination';
import { fetchExpenseStatsAggregates } from './expense-stats-aggregates';

interface CreateExpenseDto {
  name: string;
  type: string;
  category: string;
  amount: number;
  frequency?: string;
  dueDate?: string;
  status?: string;
  projectId?: string;
  isPassThrough?: boolean;
  taxStatus?: string;
  notes?: string;
}

interface UpdateExpenseDto {
  name?: string;
  type?: string;
  category?: string;
  amount?: number;
  frequency?: string;
  dueDate?: string;
  status?: string;
  projectId?: string;
  isPassThrough?: boolean;
  taxStatus?: string;
  notes?: string;
}

interface ExpenseQueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  status?: string;
  projectId?: string;
  frequency?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ExpenseStatsParams {
  dateFrom?: string;
  dateTo?: string;
  /** When set, stats match `findAll` list filter for the same project. */
  projectId?: string;
  /** When set, aggregates are scoped to this status (list/stats parity). */
  status?: string;
}

const EXPENSE_LIST_SORT_FIELDS = new Set(['createdAt', 'dueDate', 'amount', 'name', 'status']);

@Injectable()
export class ExpensesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ExpenseQueryParams) {
    const {
      page: pageIn,
      pageSize: pageSizeIn,
      type,
      category,
      status,
      projectId,
      frequency,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = params;

    const page = normalizeExpenseListPage(pageIn);
    const pageSize = normalizeExpenseListPageSize(pageSizeIn);

    const orderBy = this.buildExpenseListOrderBy(sortBy, sortOrder);

    const safeType = pickExpenseTypeFilter(type);
    const safeCategory = pickExpenseCategoryFilter(category);
    const safeStatus = pickExpenseStatusFilter(status);
    const safeFrequency = pickExpenseFrequencyFilter(frequency);

    const where = this.buildWhere({
      type: safeType,
      category: safeCategory,
      status: safeStatus,
      projectId,
      frequency: safeFrequency,
      search,
      dateFrom,
      dateTo,
    });

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async create(data: CreateExpenseDto) {
    const created = await this.prisma.expense.create({
      data: {
        name: data.name,
        type: requireExpenseType(data.type) as ExpenseTypeEnum,
        category: requireExpenseCategory(data.category) as ExpenseCategoryEnum,
        amount: data.amount,
        frequency: resolveExpenseFrequency(data.frequency) as ExpenseFrequency,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: resolveExpenseStatus(data.status) as ExpenseStatusEnum,
        projectId: data.projectId,
        isPassThrough: data.isPassThrough ?? false,
        taxStatus: resolveExpenseTaxStatus(
          data.taxStatus,
        ) as Prisma.ExpenseCreateInput['taxStatus'],
        notes: data.notes,
      },
    });
    return this.findById(created.id);
  }

  async update(id: string, data: UpdateExpenseDto) {
    await this.findById(id);

    const typePatch = data.type !== undefined ? requireExpenseTypeIfPresent(data.type) : undefined;
    const categoryPatch =
      data.category !== undefined ? requireExpenseCategoryIfPresent(data.category) : undefined;
    const frequencyPatch =
      data.frequency !== undefined ? requireExpenseFrequencyIfPresent(data.frequency) : undefined;
    const statusPatch =
      data.status !== undefined ? requireExpenseStatusIfPresent(data.status) : undefined;
    const taxStatusPatch =
      data.taxStatus !== undefined ? requireTaxStatusIfPresent(data.taxStatus) : undefined;

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
        ...(data.isPassThrough !== undefined && { isPassThrough: data.isPassThrough }),
        ...(taxStatusPatch !== undefined && {
          taxStatus: taxStatusPatch as Prisma.ExpenseUpdateInput['taxStatus'],
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getStats(params: ExpenseStatsParams = {}) {
    const safeStatus = pickExpenseStatusFilter(params.status);
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const projectWhere = params.projectId ? { projectId: params.projectId } : {};
    const statusWhere = safeStatus ? { status: safeStatus as ExpenseStatusEnum } : {};

    const scopeWhere: Prisma.ExpenseWhereInput = {
      ...projectWhere,
      ...statusWhere,
      ...(createdAt ? { createdAt } : {}),
    };

    return fetchExpenseStatsAggregates(this.prisma, scopeWhere);
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
    if (filters.status) where.status = filters.status as ExpenseStatusEnum;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.frequency) where.frequency = filters.frequency as ExpenseFrequency;
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    const createdAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }
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
