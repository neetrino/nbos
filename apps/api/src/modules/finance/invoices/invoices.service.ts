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
import { assertFirstInvoiceMinimums } from './invoice-first-payment-minimums';
import {
  MONEY_STATUS_TO_LEGACY_COMPANION,
  parseInvoiceMoneyStatus,
  resolveInvoiceMoneyStatus,
} from './invoice-money-status';
import { financeCalendarMonthKey } from '../subscriptions/subscription-coverage-month';

interface CreateInvoiceDto {
  orderId?: string;
  subscriptionId?: string;
  projectId: string;
  companyId?: string;
  clientServiceRecordId?: string;
  amount: number;
  type: string;
  dueDate?: string;
}

interface InvoiceQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  /** Filter by Invoice Card money layer (`Invoice.moneyStatus`). */
  moneyStatus?: string;
  type?: string;
  projectId?: string;
  subscriptionId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface InvoiceStatsParams {
  dateFrom?: string;
  dateTo?: string;
  subscriptionId?: string;
}

@Injectable()
export class InvoicesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: InvoiceQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      moneyStatus,
      type,
      projectId,
      subscriptionId,
      search,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.InvoiceWhereInput = {};

    if (status) where.status = status as InvoiceStatusEnum;
    const money = moneyStatus ? parseInvoiceMoneyStatus(moneyStatus) : null;
    if (moneyStatus && !money) {
      throw new BadRequestException(`Unknown invoice moneyStatus: ${moneyStatus}`);
    }
    if (money) where.moneyStatus = money;
    if (type) where.type = type as InvoiceTypeEnum;
    if (projectId) where.projectId = projectId;
    if (subscriptionId) where.subscriptionId = subscriptionId;
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
          order: {
            select: { id: true, code: true, project: { select: { id: true, name: true } } },
          },
          subscription: { select: { project: { select: { id: true, name: true } } } },
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
      items: items.map((invoice) =>
        attachInvoicePaymentCoverage({
          ...invoice,
          project: invoice.order?.project ?? invoice.subscription?.project ?? null,
        }),
      ),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: { include: { project: true } },
        subscription: { include: { project: true } },
        company: true,
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return attachInvoicePaymentCoverage({
      ...invoice,
      project: invoice.order?.project ?? invoice.subscription?.project ?? null,
    });
  }

  async create(data: CreateInvoiceDto) {
    this.assertCreateInvoiceInput(data);
    await assertFirstInvoiceMinimums(this.prisma, {
      orderId: data.orderId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
    });
    const code = await this.generateCode();
    const taxStatus = await resolveInvoiceTaxStatus(this.prisma, data);

    const due = data.dueDate ? new Date(data.dueDate) : undefined;
    const invoice = await this.prisma.invoice.create({
      data: {
        code,
        orderId: data.orderId,
        subscriptionId: data.subscriptionId,
        projectId: data.projectId,
        companyId: data.companyId,
        clientServiceRecordId: data.clientServiceRecordId,
        amount: data.amount,
        taxStatus,
        type: data.type as InvoiceTypeEnum,
        dueDate: due,
        ...(data.subscriptionId && data.type === 'SUBSCRIPTION'
          ? {
              coverageStartMonth: financeCalendarMonthKey(due ?? new Date()),
              coverageMonthCount: 1,
            }
          : {}),
      },
    });
    return this.findById(invoice.id);
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

    const now = new Date();
    const moneyStatus = resolveInvoiceMoneyStatus({
      legacyStatus: status as InvoiceStatusEnum,
      amount,
      paid,
      dueDate: invoice.dueDate,
      now,
    });

    const updateData: Prisma.InvoiceUpdateInput = {
      status: status as InvoiceStatusEnum,
      moneyStatus,
    };
    if (status === 'PAID') {
      updateData.paidDate = getLatestPaymentDate(invoice.payments);
    } else {
      updateData.paidDate = null;
    }
    await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    if (invoice.orderId) {
      await syncInvoiceOrderStatus(this.prisma, invoice.orderId);
    }

    if (status === 'PAID' && invoice.orderId) {
      await this.checkAndPromoteDeal(invoice.orderId);
    }

    return this.findById(id);
  }

  /**
   * Sets the canonical money status and the companion legacy pipeline status (orders/deals stay aligned).
   * Does not re-derive money from legacy — the requested money column wins.
   */
  async updateMoneyStatus(id: string, moneyStatusRaw: string) {
    const moneyStatus = parseInvoiceMoneyStatus(moneyStatusRaw);
    if (!moneyStatus) {
      throw new BadRequestException(`Unknown invoice moneyStatus: ${moneyStatusRaw}`);
    }
    const legacy = MONEY_STATUS_TO_LEGACY_COMPANION[moneyStatus];

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

    this.assertManualStatusTransitionAllowed(legacy, derivedStatus);

    const updateData: Prisma.InvoiceUpdateInput = {
      status: legacy,
      moneyStatus,
    };
    if (legacy === 'PAID') {
      updateData.paidDate = getLatestPaymentDate(invoice.payments);
    } else {
      updateData.paidDate = null;
    }
    await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    if (invoice.orderId) {
      await syncInvoiceOrderStatus(this.prisma, invoice.orderId);
    }

    if (legacy === 'PAID' && invoice.orderId) {
      await this.checkAndPromoteDeal(invoice.orderId);
    }

    return this.findById(id);
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

  private assertCreateInvoiceInput(data: CreateInvoiceDto) {
    if (!data.projectId?.trim()) {
      throw new BadRequestException('projectId is required to create an invoice');
    }

    if (!data.type?.trim()) {
      throw new BadRequestException('type is required to create an invoice');
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new BadRequestException('Invoice amount must be greater than zero');
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
