import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type InvoiceTypeEnum,
  type InvoiceStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

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
  projectId?: string;
  search?: string;
}

@Injectable()
export class InvoicesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: InvoiceQueryParams) {
    const { page = 1, pageSize = 20, status, projectId, search } = params;
    const where: Prisma.InvoiceWhereInput = {};

    if (status) where.status = status as InvoiceStatusEnum;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
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
    const invoice = await this.findById(id);
    const updateData: Prisma.InvoiceUpdateInput = {
      status: status as InvoiceStatusEnum,
    };
    if (status === 'PAID') {
      updateData.paidDate = new Date();
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

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

  async getStats() {
    const [total, byStatus, totalRevenue] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);
    return { total, byStatus, totalRevenue: totalRevenue._sum.amount };
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
