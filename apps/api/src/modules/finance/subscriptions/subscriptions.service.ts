import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import {
  PrismaClient,
  type Prisma,
  type SubscriptionTypeEnum,
  type SubscriptionStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { assertSubscriptionStatus, attachSubscriptionCoverage } from './subscription-coverage';
import { assertSubscriptionStatusTransition } from './subscription-status-transitions';

interface CreateSubscriptionDto {
  projectId: string;
  type: string;
  amount: number;
  billingDay: number;
  taxStatus?: string;
  startDate: string;
  endDate?: string;
  partnerId?: string;
}

interface UpdateSubscriptionDto {
  type?: string;
  amount?: number;
  billingDay?: number;
  taxStatus?: string;
  startDate?: string;
  endDate?: string;
  partnerId?: string | null;
}

interface SubscriptionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  partnerId?: string;
  status?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SubscriptionStatsParams {
  dateFrom?: string;
  dateTo?: string;
  partnerId?: string;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async findAll(params: SubscriptionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      partnerId,
      status,
      type,
      search,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.SubscriptionWhereInput = {};

    if (projectId) where.projectId = projectId;
    Object.assign(where, this.subscriptionPartnerWhere(partnerId));
    if (status) where.status = status as SubscriptionStatusEnum;
    if (type) where.type = type as SubscriptionTypeEnum;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const createdAt = this.buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          partner: { select: { id: true, name: true } },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items: items.map(attachSubscriptionCoverage),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        project: true,
        partner: true,
        invoices: {
          include: { payments: { select: { id: true, amount: true, paymentDate: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return attachSubscriptionCoverage(subscription);
  }

  async create(data: CreateSubscriptionDto) {
    const code = await this.generateCode();
    const subscription = await this.prisma.subscription.create({
      data: {
        code,
        projectId: data.projectId,
        type: data.type as SubscriptionTypeEnum,
        amount: data.amount,
        billingDay: data.billingDay,
        taxStatus:
          (data.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set']) ?? 'TAX',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        partnerId: data.partnerId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        partner: { select: { id: true, name: true } },
      },
    });
    return attachSubscriptionCoverage(subscription);
  }

  async update(id: string, data: UpdateSubscriptionDto) {
    await this.findById(id);

    const updateData: Prisma.SubscriptionUpdateInput = {};
    if (data.type) updateData.type = data.type as SubscriptionTypeEnum;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.billingDay !== undefined) updateData.billingDay = data.billingDay;
    if (data.taxStatus) {
      updateData.taxStatus =
        data.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set'];
    }
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.partnerId !== undefined)
      updateData.partner = data.partnerId
        ? { connect: { id: data.partnerId } }
        : { disconnect: true };

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, code: true, name: true } },
        partner: { select: { id: true, name: true } },
      },
    });
    return attachSubscriptionCoverage(subscription);
  }

  async updateStatus(id: string, status: string) {
    assertSubscriptionStatus(status);
    const current = await this.findById(id);
    assertSubscriptionStatusTransition(
      current.status as SubscriptionStatusEnum,
      status as SubscriptionStatusEnum,
    );

    const updateData: Prisma.SubscriptionUpdateInput = {
      status: status as SubscriptionStatusEnum,
    };
    if (status === 'ACTIVE' && !current.startDate) {
      updateData.startDate = new Date();
    }
    if (status === 'CANCELLED') {
      updateData.endDate = new Date();
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });
    return attachSubscriptionCoverage(subscription);
  }

  async getStats(params: SubscriptionStatsParams = {}) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const snapshotDate = params.dateTo ? new Date(params.dateTo) : new Date();
    const partnerWhere = this.subscriptionPartnerWhere(params.partnerId);

    const [total, byStatus, byType, totalRevenue, activeSubscriptions] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...partnerWhere,
        },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...partnerWhere,
        },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['type'],
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...partnerWhere,
        },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          startDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
          ...partnerWhere,
        },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          startDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
          ...partnerWhere,
        },
      }),
    ]);

    return {
      total,
      byStatus,
      byType,
      activeSubscriptions,
      monthlyRevenue: totalRevenue._sum.amount,
    };
  }

  private subscriptionPartnerWhere(partnerId?: string): Prisma.SubscriptionWhereInput {
    if (!partnerId) return {};
    if (partnerId === SUBSCRIPTION_PARTNER_FILTER_UNLINKED) {
      return { partnerId: null };
    }
    return { partnerId };
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

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SUB-${year}-`;
    const last = await this.prisma.subscription.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
