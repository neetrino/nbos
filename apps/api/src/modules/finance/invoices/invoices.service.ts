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
  sumAmounts,
} from '../finance-status.utils';
import { attachInvoicePaymentCoverage } from './invoice-payment-coverage';
import {
  buildDateRange,
  getInvoiceStats,
  resolveInvoiceTaxStatus,
  syncInvoiceOrderStatus,
} from './invoice-service-helpers';

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

    const createdAt = buildDateRange(dateFrom, dateTo);
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
      items: items.map(attachInvoicePaymentCoverage),
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
    return attachInvoicePaymentCoverage(invoice);
  }

  async create(data: CreateInvoiceDto) {
    const code = await this.generateCode();
    const taxStatus = await resolveInvoiceTaxStatus(this.prisma, data);

    const invoice = await this.prisma.invoice.create({
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
        payments: { select: { id: true, amount: true, paymentDate: true } },
        _count: { select: { payments: true } },
      },
    });
    return attachInvoicePaymentCoverage(invoice);
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
      include: {
        order: { select: { id: true, code: true } },
        company: { select: { id: true, name: true } },
        payments: { select: { id: true, amount: true, paymentDate: true } },
        _count: { select: { payments: true } },
      },
    });

    if (invoice.orderId) {
      await syncInvoiceOrderStatus(this.prisma, invoice.orderId);
    }

    if (status === 'PAID' && invoice.orderId) {
      await this.checkAndPromoteDeal(invoice.orderId);
    }

    return attachInvoicePaymentCoverage(updated);
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
    return getInvoiceStats(this.prisma, params);
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
}
