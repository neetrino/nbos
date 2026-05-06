import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type BonusTypeEnum,
  type BonusStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import {
  foldBonusProductPools,
  type BonusOrderPoolGroupRow,
  type BonusProductPoolRow,
} from './bonus-product-pools';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

interface CreateBonusDto {
  employeeId: string;
  orderId: string;
  projectId: string;
  type: string;
  amount: number;
  percent: number;
  status?: string;
  kpiGatePassed?: boolean;
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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

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
    const created = await this.prisma.bonusEntry.create({
      data: {
        employeeId: data.employeeId,
        orderId: data.orderId,
        projectId: data.projectId,
        type: data.type as BonusTypeEnum,
        amount: data.amount,
        percent: data.percent,
        status: (data.status as BonusStatusEnum) ?? 'INCOMING',
        kpiGatePassed: data.kpiGatePassed,
        payoutMonth: data.payoutMonth ? new Date(data.payoutMonth) : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        order: { select: { id: true, code: true, totalAmount: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
    await syncProductBonusPoolForOrder(this.prisma, data.orderId, this.notifications);
    return created;
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.bonusEntry.update({
      where: { id },
      data: { status: status as BonusStatusEnum },
    });
    await syncProductBonusPoolForOrder(this.prisma, existing.orderId, this.notifications);
    return updated;
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

  async getProductPools(): Promise<BonusProductPoolRow[]> {
    const raw = await this.prisma.bonusEntry.groupBy({
      by: ['orderId', 'status'] as const,
      _count: true,
      _sum: { amount: true },
    });

    if (raw.length === 0) {
      return [];
    }

    const orderIds = [...new Set(raw.map((r) => r.orderId))];
    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        code: true,
        projectId: true,
        productId: true,
        extensionId: true,
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        extension: { select: { id: true, name: true } },
      },
    });

    const folded = foldBonusProductPools(raw as BonusOrderPoolGroupRow[], orders);
    if (folded.length === 0) {
      return [];
    }
    const anchorIds = [...new Set(folded.map((r) => r.anchorOrderId))];
    return this.mergeProductPoolLedgersWithIds(folded, anchorIds);
  }

  private async mergeProductPoolLedgersWithIds(
    rows: BonusProductPoolRow[],
    anchorIds: string[],
  ): Promise<BonusProductPoolRow[]> {
    if (anchorIds.length === 0) {
      return rows;
    }
    const ledgers = await this.prisma.productBonusPool.findMany({
      where: { orderId: { in: anchorIds } },
      select: {
        orderId: true,
        totalPlannedAmount: true,
        totalReleasedAmount: true,
        totalRemainingAmount: true,
        availableFunding: true,
        status: true,
      },
    });
    const byOrder = new Map(ledgers.map((row) => [row.orderId, row] as const));
    return rows.map((row) => {
      const ledger = byOrder.get(row.anchorOrderId);
      if (!ledger) {
        return row;
      }
      return {
        ...row,
        ledgerPlannedAmount: ledger.totalPlannedAmount.toFixed(2),
        ledgerReleasedAmount: ledger.totalReleasedAmount.toFixed(2),
        ledgerRemainingAmount: ledger.totalRemainingAmount.toFixed(2),
        ledgerAvailableFunding: ledger.availableFunding.toFixed(2),
        ledgerPoolStatus: ledger.status,
      };
    });
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
