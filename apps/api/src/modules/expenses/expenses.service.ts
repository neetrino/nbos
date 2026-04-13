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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ExpensesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ExpenseQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      type,
      category,
      status,
      projectId,
      frequency,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhere({ type, category, status, projectId, frequency, search });

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
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
    return this.prisma.expense.create({
      data: {
        name: data.name,
        type: data.type as ExpenseTypeEnum,
        category: data.category as ExpenseCategoryEnum,
        amount: data.amount,
        frequency: (data.frequency as ExpenseFrequency) ?? 'ONE_TIME',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: (data.status as ExpenseStatusEnum) ?? 'THIS_MONTH',
        projectId: data.projectId,
        isPassThrough: data.isPassThrough ?? false,
        taxStatus: data.taxStatus as Prisma.ExpenseCreateInput['taxStatus'],
        notes: data.notes,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateExpenseDto) {
    await this.findById(id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as ExpenseTypeEnum }),
        ...(data.category && { category: data.category as ExpenseCategoryEnum }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.frequency && { frequency: data.frequency as ExpenseFrequency }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.status && { status: data.status as ExpenseStatusEnum }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.isPassThrough !== undefined && { isPassThrough: data.isPassThrough }),
        ...(data.taxStatus && {
          taxStatus: data.taxStatus as Prisma.ExpenseUpdateInput['taxStatus'],
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getStats() {
    const [byCategory, totalAmount] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['category'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);
    return { byCategory, totalAmount: totalAmount._sum.amount };
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
    return where;
  }
}
