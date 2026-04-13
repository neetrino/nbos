import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type BonusTypeEnum,
  type BonusStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface CreateBonusDto {
  employeeId: string;
  orderId: string;
  projectId: string;
  type: string;
  amount: number;
  percent: number;
  status?: string;
  kpiGatePassed?: boolean;
  holdbackPercent?: number;
  holdbackReleaseDate?: string;
  payoutMonth?: string;
}

interface BonusQueryParams {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  orderId?: string;
  projectId?: string;
  status?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class BonusService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: BonusQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      employeeId,
      orderId,
      projectId,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhere({ employeeId, orderId, projectId, status, type });

    const [items, total] = await Promise.all([
      this.prisma.bonusEntry.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          order: { select: { id: true, code: true, totalAmount: true } },
          project: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bonusEntry.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const bonus = await this.prisma.bonusEntry.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, role: true } },
        order: { select: { id: true, code: true, totalAmount: true, status: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
    if (!bonus) throw new NotFoundException(`Bonus entry ${id} not found`);
    return bonus;
  }

  async create(data: CreateBonusDto) {
    return this.prisma.bonusEntry.create({
      data: {
        employeeId: data.employeeId,
        orderId: data.orderId,
        projectId: data.projectId,
        type: data.type as BonusTypeEnum,
        amount: data.amount,
        percent: data.percent,
        status: (data.status as BonusStatusEnum) ?? 'INCOMING',
        kpiGatePassed: data.kpiGatePassed,
        holdbackPercent: data.holdbackPercent,
        holdbackReleaseDate: data.holdbackReleaseDate
          ? new Date(data.holdbackReleaseDate)
          : undefined,
        payoutMonth: data.payoutMonth ? new Date(data.payoutMonth) : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        order: { select: { id: true, code: true, totalAmount: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.bonusEntry.update({
      where: { id },
      data: { status: status as BonusStatusEnum },
    });
  }

  async getStats() {
    const [byStatus, totalAmount] = await Promise.all([
      this.prisma.bonusEntry.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.bonusEntry.aggregate({ _sum: { amount: true } }),
    ]);
    return { byStatus, totalAmount: totalAmount._sum.amount };
  }

  private buildWhere(
    filters: Omit<BonusQueryParams, 'page' | 'pageSize' | 'search' | 'sortBy' | 'sortOrder'>,
  ): Prisma.BonusEntryWhereInput {
    const where: Prisma.BonusEntryWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status as BonusStatusEnum;
    if (filters.type) where.type = filters.type as BonusTypeEnum;
    return where;
  }
}
