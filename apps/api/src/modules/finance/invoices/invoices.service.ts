import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type InvoiceTypeEnum,
  type InvoiceStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  getLatestPaymentDate,
  resolveBaseInvoiceStatus,
  resolveOrderStatus,
  sumAmounts,
} from '../finance-status.utils';

interface CreateInvoiceDto {
  orderId?: string;
  subscriptionId?: string;
  projectId: string;
  companyId?: string;
  amount: number;
  type: string;
  dueDate?: string;
}

interface InvoiceQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface InvoiceStatsParams {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class InvoicesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: InvoiceQueryParams) {
    const { page = 1, pageSize = 20, status, type, projectId, search, dateFrom, dateTo } = params;
    const where: Prisma.InvoiceWhereInput = {};

    if (status) where.status = status as InvoiceStatusEnum;
    if (type) where.type = type as InvoiceTypeEnum;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    const createdAt = this.buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          order: { select: { id: true, code: true } },
          company: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true, paymentDate: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: true,
        subscription: true,
        company: true,
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async create(data: CreateInvoiceDto) {
    const code = await this.generateCode();
    const taxStatus = await this.resolveTaxStatus(data);

    return this.prisma.invoice.create({
      data: {
        code,
        orderId: data.orderId,
        subscriptionId: data.subscriptionId,
        projectId: data.projectId,
        companyId: data.companyId,
        amount: data.amount,
        taxStatus,
        type: data.type as InvoiceTypeEnum,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        order: { select: { id: true, code: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        amount: true,
        dueDate: true,
        status: true,
        payments: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    const amount = Number(invoice.amount);
    const paid = sumAmounts(invoice.payments);
    const derivedStatus = resolveBaseInvoiceStatus({
      amount,
      paid,
      dueDate: invoice.dueDate,
    });

    this.assertManualStatusTransitionAllowed(status as InvoiceStatusEnum, derivedStatus);

    const updateData: Prisma.InvoiceUpdateInput = {
      status: status as InvoiceStatusEnum,
    };
    if (status === 'PAID') {
      updateData.paidDate = getLatestPaymentDate(invoice.payments);
    } else {
      updateData.paidDate = null;
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    if (invoice.orderId) {
      await this.syncOrderStatus(invoice.orderId);
    }

    if (status === 'PAID' && invoice.orderId) {
      await this.checkAndPromoteDeal(invoice.orderId);
    }

    return updated;
  }

  private async checkAndPromoteDeal(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deal: true,
        invoices: { select: { status: true, amount: true } },
      },
    });
    if (!order?.deal || order.deal.status === 'WON' || order.deal.status === 'FAILED') return;

    const allPaid =
      order.invoices.length > 0 && order.invoices.every((inv) => inv.status === 'PAID');
    if (!allPaid) return;

    const paidTotal = order.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const dealAmount = Number(order.deal.amount ?? 0);

    if (dealAmount > 0 && paidTotal >= dealAmount) {
      await this.prisma.deal.update({
        where: { id: order.deal.id },
        data: { status: 'WON' },
      });
    }
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.invoice.delete({ where: { id } });
  }

  private assertManualStatusTransitionAllowed(
    requestedStatus: InvoiceStatusEnum,
    derivedStatus: InvoiceStatusEnum,
  ) {
    if (requestedStatus === 'PAID' && derivedStatus !== 'PAID') {
      throw new BadRequestException('Cannot mark invoice as paid before payments fully cover it');
    }

    if (derivedStatus === 'PAID' && requestedStatus !== 'PAID') {
      throw new BadRequestException('Fully paid invoices must stay in PAID status');
    }
  }

  async getStats(params: InvoiceStatsParams = {}) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const paidDate = this.buildDateRange(params.dateFrom, params.dateTo);

    const [total, byStatus, totalRevenue, outstanding, overdue] = await Promise.all([
      this.prisma.invoice.count({
        ...(createdAt ? { where: { createdAt } } : {}),
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        ...(createdAt ? { where: { createdAt } } : {}),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          ...(paidDate ? { paidDate } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { not: 'PAID' },
          ...(createdAt ? { createdAt } : {}),
        },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'DELAYED',
          ...(createdAt ? { createdAt } : {}),
        },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      byStatus,
      totalRevenue: totalRevenue._sum.amount,
      outstanding: {
        count: outstanding._count,
        amount: outstanding._sum.amount,
      },
      overdue: {
        count: overdue._count,
        amount: overdue._sum.amount,
      },
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
    const last = await this.prisma.invoice.findFirst({
      where: { code: { startsWith: `INV-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async syncOrderStatus(orderId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orderId },
      select: {
        status: true,
        payments: { select: { amount: true } },
      },
    });
    if (invoices.length === 0) {
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: resolveOrderStatus(invoices) },
    });
  }

  private async resolveTaxStatus(
    data: CreateInvoiceDto,
  ): Promise<Prisma.InvoiceCreateInput['taxStatus']> {
    if (data.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
        select: { taxStatus: true },
      });
      if (order?.taxStatus) {
        return order.taxStatus as Prisma.InvoiceCreateInput['taxStatus'];
      }
    }

    if (data.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: data.subscriptionId },
        select: { taxStatus: true },
      });
      if (subscription?.taxStatus) {
        return subscription.taxStatus as Prisma.InvoiceCreateInput['taxStatus'];
      }
    }

    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
        select: { taxStatus: true },
      });
      if (company?.taxStatus) {
        return company.taxStatus as Prisma.InvoiceCreateInput['taxStatus'];
      }
    }

    return 'TAX';
  }
}
