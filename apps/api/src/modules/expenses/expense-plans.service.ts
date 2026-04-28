import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type Prisma,
  type ExpenseCategoryEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { pickExpenseCategoryFilter } from './expense-query-enum-guards';
import { requireExpenseCategory, resolveExpenseFrequency } from './expense-mutation-enum-validators';
import { normalizeExpenseListPage, normalizeExpenseListPageSize } from './expenses-list-pagination';

const EXPENSE_PLAN_SORT_FIELDS = new Set(['createdAt', 'nextDueDate', 'amount', 'name']);

export interface ExpensePlanQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateExpensePlanBody {
  name: string;
  category: string;
  amount: number;
  frequency?: string;
  nextDueDate?: string | null;
  provider?: string | null;
  projectId?: string | null;
  autoGenerate?: boolean;
  notes?: string | null;
}

export type UpdateExpensePlanBody = Partial<CreateExpensePlanBody>;

function toAmountDecimal(amount: number): Decimal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException('Amount must be a positive number');
  }
  return new Decimal(amount);
}

function serializePlanRow<T extends { amount: Decimal | unknown }>(row: T) {
  return {
    ...row,
    amount: String(row.amount),
  };
}

@Injectable()
export class ExpensePlansService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ExpensePlanQueryParams) {
    const page = normalizeExpenseListPage(params.page);
    const pageSize = normalizeExpenseListPageSize(params.pageSize);
    const safeCategory = pickExpenseCategoryFilter(params.category);
    const where: Prisma.ExpensePlanWhereInput = {
      ...(safeCategory ? { category: safeCategory as ExpenseCategoryEnum } : {}),
      ...(params.projectId?.trim() ? { projectId: params.projectId.trim() } : {}),
      ...(params.search?.trim()
        ? {
            OR: [
              { name: { contains: params.search.trim(), mode: 'insensitive' } },
              { provider: { contains: params.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(params.sortBy, params.sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.expensePlan.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          _count: { select: { expenses: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expensePlan.count({ where }),
    ]);

    return {
      items: items.map((row) => serializePlanRow(row)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const row = await this.prisma.expensePlan.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { expenses: true } },
      },
    });
    if (!row) throw new NotFoundException('Expense plan not found');
    return serializePlanRow(row);
  }

  async create(body: CreateExpensePlanBody) {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('Name is required');
    const category = requireExpenseCategory(body.category);
    const frequency = resolveExpenseFrequency(body.frequency);
    const amount = toAmountDecimal(body.amount);
    const projectId = await this.resolveProjectIdOrThrow(body.projectId);

    const row = await this.prisma.expensePlan.create({
      data: {
        name,
        category: category as Prisma.ExpensePlanCreateInput['category'],
        amount,
        frequency: frequency as Prisma.ExpensePlanCreateInput['frequency'],
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        provider: body.provider?.trim() || null,
        projectId,
        autoGenerate: Boolean(body.autoGenerate),
        notes: body.notes?.trim() || null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { expenses: true } },
      },
    });
    return serializePlanRow(row);
  }

  async update(id: string, body: UpdateExpensePlanBody) {
    await this.ensureExists(id);
    const data: Prisma.ExpensePlanUpdateInput = {};

    if (body.name !== undefined) {
      const n = body.name.trim();
      if (!n) throw new BadRequestException('Name cannot be empty');
      data.name = n;
    }
    if (body.category !== undefined) {
      data.category = requireExpenseCategory(body.category) as Prisma.ExpensePlanUpdateInput['category'];
    }
    if (body.amount !== undefined) {
      data.amount = toAmountDecimal(body.amount);
    }
    if (body.frequency !== undefined) {
      data.frequency = resolveExpenseFrequency(body.frequency) as Prisma.ExpensePlanUpdateInput['frequency'];
    }
    if (body.nextDueDate !== undefined) {
      data.nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : null;
    }
    if (body.provider !== undefined) {
      data.provider = body.provider?.trim() || null;
    }
    if (body.projectId !== undefined) {
      const pid = await this.resolveProjectIdOrThrow(body.projectId);
      data.project = pid ? { connect: { id: pid } } : { disconnect: true };
    }
    if (body.autoGenerate !== undefined) {
      data.autoGenerate = Boolean(body.autoGenerate);
    }
    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() || null;
    }

    const row = await this.prisma.expensePlan.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { expenses: true } },
      },
    });
    return serializePlanRow(row);
  }

  async delete(id: string) {
    await this.ensureExists(id);
    await this.prisma.expensePlan.delete({ where: { id } });
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.ExpensePlanOrderByWithRelationInput {
    const dir = sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const field = sortBy && EXPENSE_PLAN_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    return { [field]: dir } as Prisma.ExpensePlanOrderByWithRelationInput;
  }

  private async ensureExists(id: string): Promise<void> {
    const n = await this.prisma.expensePlan.count({ where: { id } });
    if (!n) throw new NotFoundException('Expense plan not found');
  }

  private async resolveProjectIdOrThrow(projectId: string | null | undefined): Promise<string | null> {
    if (projectId === undefined || projectId === null || projectId === '') return null;
    const id = projectId.trim();
    const p = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new BadRequestException('Project not found');
    return id;
  }
}
