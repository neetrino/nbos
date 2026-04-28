import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type OrderTypeEnum,
  type PaymentTypeEnum,
  type OrderStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { attachOrderReconciliation } from './order-reconciliation';
import type { OrderReconciliationListGap } from './order-reconciliation-list-filter';
import { ORDER_LIST_INCLUDE, type OrderListRow } from './orders-list-include';
import { queryOrderIdsPageForReconciliationGap } from './orders-reconciliation-gap-query';
import { queryOrderStatsForReconciliationGap } from './orders-reconciliation-gap-stats-query';

interface CreateOrderDto {
  projectId: string;
  dealId?: string;
  productId?: string;
  extensionId?: string;
  type: string;
  paymentType: string;
  totalAmount: number;
  currency?: string;
  taxStatus?: string;
  partnerId?: string;
  partnerPercent?: number;
}

interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  /** Filter orders by linked partner (Parity with subscriptions partner drill-down). */
  partnerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  reconciliationGap?: OrderReconciliationListGap;
}

interface OrderStatsParams {
  dateFrom?: string;
  dateTo?: string;
  reconciliationGap?: OrderReconciliationListGap;
  /** With reconciliation gap: same dimensions as list (`findAll`). */
  status?: string;
  projectId?: string;
  partnerId?: string;
  search?: string;
}

@Injectable()
export class OrdersService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: OrderQueryParams) {
    if (params.reconciliationGap) {
      return this.findAllWithReconciliationGap(params);
    }
    return this.findAllDefault(params);
  }

  private async findAllDefault(params: OrderQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      projectId,
      partnerId,
      search,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status as OrderStatusEnum;
    if (projectId) where.projectId = projectId;
    if (partnerId) where.partnerId = partnerId;
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    const createdAt = this.buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: this.mapOrdersToListItems(orders),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private async findAllWithReconciliationGap(params: OrderQueryParams) {
    const gap = params.reconciliationGap;
    if (!gap) {
      throw new Error('reconciliationGap is required');
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const { total, ids } = await queryOrderIdsPageForReconciliationGap(this.prisma, {
      gap,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      status: params.status,
      projectId: params.projectId,
      partnerId: params.partnerId,
      search: params.search,
      page,
      pageSize,
    });

    if (ids.length === 0) {
      return {
        items: [],
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: ids } },
      include: ORDER_LIST_INCLUDE,
    });

    const orderById = new Map(orders.map((order) => [order.id, order]));
    const sortedOrders = ids
      .map((id) => orderById.get(id))
      .filter((order): order is (typeof orders)[number] => Boolean(order));

    return {
      items: this.mapOrdersToListItems(sortedOrders),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private mapOrdersToListItems(orders: OrderListRow[]) {
    return orders.map((order) => {
      const orderWithReconciliation = attachOrderReconciliation(order);

      return {
        ...orderWithReconciliation,
        amount: order.totalAmount,
        paidAmount: orderWithReconciliation.reconciliation.paidAmount,
        company: order.project.company,
        contact: order.project.contact,
      };
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            company: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        deal: true,
        product: true,
        extension: true,
        partner: true,
        invoices: { include: { payments: true } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const orderWithReconciliation = attachOrderReconciliation(order);

    return {
      ...orderWithReconciliation,
      amount: order.totalAmount,
      paidAmount: orderWithReconciliation.reconciliation.paidAmount,
      company: order.project.company,
      contact: order.project.contact,
    };
  }

  async create(data: CreateOrderDto) {
    const code = await this.generateCode();
    const created = await this.prisma.order.create({
      data: {
        code,
        projectId: data.projectId,
        dealId: data.dealId,
        productId: data.productId,
        extensionId: data.extensionId,
        type: data.type as OrderTypeEnum,
        paymentType: data.paymentType as PaymentTypeEnum,
        totalAmount: data.totalAmount,
        currency: data.currency ?? 'AMD',
        taxStatus: (data.taxStatus as Prisma.OrderCreateInput['taxStatus']) ?? 'TAX',
        partnerId: data.partnerId,
        partnerPercent: data.partnerPercent,
      },
    });
    return this.findById(created.id);
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    await this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatusEnum },
    });
    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async getStats(params: OrderStatsParams = {}) {
    if (params.reconciliationGap) {
      return queryOrderStatsForReconciliationGap(this.prisma, {
        gap: params.reconciliationGap,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        status: params.status,
        projectId: params.projectId,
        partnerId: params.partnerId,
        search: params.search,
      });
    }

    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const paymentDate = this.buildDateRange(params.dateFrom, params.dateTo);
    const partnerScope = params.partnerId ? { partnerId: params.partnerId } : {};
    const orderWhere = {
      ...partnerScope,
      ...(createdAt ? { createdAt } : {}),
    };
    const hasOrderWhere = Object.keys(orderWhere).length > 0;

    const [totalOrders, totalAmount, byStatus, collected] = await Promise.all([
      this.prisma.order.count({
        ...(hasOrderWhere ? { where: orderWhere } : {}),
      }),
      this.prisma.order.aggregate({
        ...(hasOrderWhere ? { where: orderWhere } : {}),
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        ...(hasOrderWhere ? { where: orderWhere } : {}),
        _count: true,
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...(paymentDate ? { paymentDate } : {}),
          invoice: {
            orderId: { not: null },
            ...(params.partnerId ? { order: { partnerId: params.partnerId } } : {}),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalAmountValue = Number(totalAmount._sum.totalAmount ?? 0);
    const collectedAmount = Number(collected._sum.amount ?? 0);

    return {
      totalOrders,
      totalAmount: totalAmount._sum.totalAmount,
      collectedAmount: collected._sum.amount,
      outstandingAmount: totalAmountValue - collectedAmount,
      byStatus,
    };
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
    const last = await this.prisma.order.findFirst({
      where: { code: { startsWith: `ORD-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `ORD-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
