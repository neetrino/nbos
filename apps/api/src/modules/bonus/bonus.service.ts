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
import { queryBonusPoolEmployeeLines } from './bonus-pool-employee-lines';
import {
  parsePoolKeysQuery,
  queryBonusPoolEmployeeLinesBatch,
  type BonusPoolEmployeeLinesBatchDto,
} from './bonus-pool-lines-batch';
import { queryBonusPoolTimeline } from './bonus-pool-timeline';
import { triggerPoolProportionalAutoRelease } from './bonus-pool-auto-release-trigger';
import { deriveBonusPoolFundingMetrics, sumPoolLedgerFields } from './bonus-pool-funding-health';
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
      page: rawPage,
      pageSize: rawPageSize,
      employeeId,
      orderId,
      projectId,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const page =
      typeof rawPage === 'number' && Number.isFinite(rawPage) && rawPage >= 1
        ? Math.min(10_000, Math.floor(rawPage))
        : 1;
    const pageSize =
      typeof rawPageSize === 'number' && Number.isFinite(rawPageSize) && rawPageSize >= 1
        ? Math.min(200, Math.floor(rawPageSize))
        : 20;

    const where = this.buildWhere({ employeeId, orderId, projectId, status, type });
    const searchTrimmed = params.search?.trim();
    const listWhere: Prisma.BonusEntryWhereInput = searchTrimmed
      ? {
          AND: [
            where,
            {
              OR: [
                {
                  employee: {
                    firstName: { contains: searchTrimmed, mode: 'insensitive' },
                  },
                },
                {
                  employee: {
                    lastName: { contains: searchTrimmed, mode: 'insensitive' },
                  },
                },
                { employee: { email: { contains: searchTrimmed, mode: 'insensitive' } } },
                { order: { code: { contains: searchTrimmed, mode: 'insensitive' } } },
                { project: { name: { contains: searchTrimmed, mode: 'insensitive' } } },
                { project: { code: { contains: searchTrimmed, mode: 'insensitive' } } },
              ],
            },
          ],
        }
      : where;

    const [items, total] = await Promise.all([
      this.prisma.bonusEntry.findMany({
        where: listWhere,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          order: { select: { id: true, code: true, totalAmount: true } },
          project: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bonusEntry.count({ where: listWhere }),
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
    const withLedgers = await this.mergeProductPoolLedgers(folded);
    return this.attachPoolEmployeeCounts(withLedgers);
  }

  async getProductPoolEmployeeLines(poolKey: string) {
    return queryBonusPoolEmployeeLines(this.prisma, poolKey);
  }

  async getProductPoolTimeline(poolKey: string) {
    return queryBonusPoolTimeline(this.prisma, poolKey);
  }

  async triggerProductPoolAutoRelease(poolKey: string) {
    return triggerPoolProportionalAutoRelease(this.prisma, poolKey);
  }

  async getProductPoolEmployeeLinesBatch(poolKeysRaw: string): Promise<{
    items: BonusPoolEmployeeLinesBatchDto[];
  }> {
    const poolKeys = parsePoolKeysQuery(poolKeysRaw);
    const items = await queryBonusPoolEmployeeLinesBatch(this.prisma, poolKeys);
    return { items };
  }

  private async mergeProductPoolLedgers(
    rows: BonusProductPoolRow[],
  ): Promise<BonusProductPoolRow[]> {
    const allOrderIds = [...new Set(rows.flatMap((r) => r.orderIds))];
    if (allOrderIds.length === 0) {
      return rows;
    }
    const ledgers = await this.prisma.productBonusPool.findMany({
      where: { orderId: { in: allOrderIds } },
      select: {
        orderId: true,
        totalPlannedAmount: true,
        totalReleasedAmount: true,
        totalRemainingAmount: true,
        availableFunding: true,
        overFundingAmount: true,
        status: true,
      },
    });
    const byOrder = new Map(ledgers.map((row) => [row.orderId, row] as const));

    return rows.map((row) => {
      const poolLedgers = row.orderIds
        .map((id) => byOrder.get(id))
        .filter((l): l is NonNullable<typeof l> => l != null);
      if (poolLedgers.length === 0) {
        return row;
      }
      const merged = sumPoolLedgerFields(poolLedgers);
      const metrics = deriveBonusPoolFundingMetrics({
        planned: merged.planned,
        received: merged.received,
        available: merged.available,
        remaining: merged.remaining,
        overFunding: merged.overFunding,
        ledgerStatus: merged.ledgerStatus,
      });
      return {
        ...row,
        ledgerPlannedAmount: merged.planned.toFixed(2),
        ledgerReleasedAmount: merged.released.toFixed(2),
        ledgerRemainingAmount: merged.remaining.toFixed(2),
        ledgerAvailableFunding: merged.available.toFixed(2),
        ledgerOverFundingAmount: merged.overFunding.toFixed(2),
        ledgerReceivedAmount: merged.received.toFixed(2),
        ledgerPoolStatus: merged.ledgerStatus,
        fundingFillPercent: metrics.fundingFillPercent,
        fundingHealth: metrics.fundingHealth,
      };
    });
  }

  private async attachPoolEmployeeCounts(
    rows: BonusProductPoolRow[],
  ): Promise<BonusProductPoolRow[]> {
    const allOrderIds = [...new Set(rows.flatMap((r) => r.orderIds))];
    if (allOrderIds.length === 0) {
      return rows;
    }
    const entries = await this.prisma.bonusEntry.findMany({
      where: { orderId: { in: allOrderIds } },
      select: { orderId: true, employeeId: true },
    });
    const orderToPool = new Map<string, string>();
    for (const row of rows) {
      for (const orderId of row.orderIds) {
        orderToPool.set(orderId, row.poolKey);
      }
    }
    const employeesByPool = new Map<string, Set<string>>();
    for (const entry of entries) {
      const poolKey = orderToPool.get(entry.orderId);
      if (!poolKey) continue;
      const set = employeesByPool.get(poolKey) ?? new Set<string>();
      set.add(entry.employeeId);
      employeesByPool.set(poolKey, set);
    }
    return rows.map((row) => ({
      ...row,
      employeeCount: employeesByPool.get(row.poolKey)?.size ?? 0,
    }));
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
