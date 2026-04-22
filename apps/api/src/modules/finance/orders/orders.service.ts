import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type OrderTypeEnum,
  type PaymentTypeEnum,
  type OrderStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

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
  search?: string;
}

@Injectable()
export class OrdersService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: OrderQueryParams) {
    const { page = 1, pageSize = 20, status, projectId, search } = params;
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status as OrderStatusEnum;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              company: { select: { id: true, name: true } },
              contact: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          deal: { select: { id: true, code: true } },
          product: { select: { id: true, name: true, productType: true } },
          extension: { select: { id: true, name: true } },
          invoices: {
            select: {
              id: true,
              code: true,
              status: true,
              amount: true,
              payments: { select: { amount: true } },
            },
          },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    const items = orders.map((order) => {
      const paidAmount = (order.invoices ?? []).reduce(
        (sum, invoice) =>
          sum +
          (invoice.payments ?? []).reduce(
            (invoiceSum, payment) => invoiceSum + Number(payment.amount),
            0,
          ),
        0,
      );

      return {
        ...order,
        amount: order.totalAmount,
        paidAmount,
        company: order.project.company,
        contact: order.project.contact,
      };
    });

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
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

    const paidAmount = (order.invoices ?? []).reduce(
      (sum, invoice) =>
        sum +
        (invoice.payments ?? []).reduce(
          (invoiceSum, payment) => invoiceSum + Number(payment.amount),
          0,
        ),
      0,
    );

    return {
      ...order,
      amount: order.totalAmount,
      paidAmount,
      company: order.project.company,
      contact: order.project.contact,
    };
  }

  async create(data: CreateOrderDto) {
    const code = await this.generateCode();
    return this.prisma.order.create({
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
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatusEnum },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async getStats() {
    const [totalOrders, totalAmount, byStatus, collected] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          invoice: {
            orderId: { not: null },
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
