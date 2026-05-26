import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type InvoiceTypeEnum,
  type InvoiceMoneyStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { getLatestPaymentDate, sumAmounts } from '../finance-status.utils';
import { attachInvoicePaymentCoverage } from './invoice-payment-coverage';
import {
  buildDateRange,
  getInvoiceStats,
  resolveInvoiceTaxStatus,
  syncInvoiceOrderStatus,
} from './invoice-service-helpers';
import { assertFirstInvoiceMinimums } from './invoice-first-payment-minimums';
import { deriveBaseInvoiceMoneyStatus, parseInvoiceMoneyStatus } from './invoice-money-status';
import { financeCalendarMonthKey } from '../subscriptions/subscription-coverage-month';
import { DealWonHandler } from '../../crm/deals/deal-won.handler';
import { dealDetailInclude } from '../../crm/deals/deal.includes';
import {
  cancelOfficialInvoiceRequest,
  sendOfficialInvoiceRequest,
  updateOfficialInvoiceGovId,
} from './invoice-official-request';
import { OperationalJournalService } from '../journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../journal/posting-period-guard';
import {
  applyInvoiceGeneralUpdate,
  parseUpdateInvoiceGeneralInput,
  type UpdateInvoiceGeneralInput,
} from './invoice-general-update';
import { resolveCreateInvoiceType, resolveInvoiceDueDate } from './invoice-create-resolver';
import { resolveInvoiceProjectRow } from './invoice-project-resolve';
import { INVOICE_ORDER_DETAIL_INCLUDE, INVOICE_ORDER_SELECT } from './invoice-order-select';

interface CreateInvoiceDto {
  orderId?: string;
  subscriptionId?: string;
  projectId?: string;
  companyId?: string;
  clientServiceRecordId?: string;
  amount: number;
  type?: string;
  dueDate?: string;
}

interface InvoiceQueryParams {
  page?: number;
  pageSize?: number;
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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly dealWonHandler: DealWonHandler,
    private readonly operationalJournal: OperationalJournalService,
  ) {}

  async findAll(params: InvoiceQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      moneyStatus,
      type,
      projectId,
      subscriptionId,
      search,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.InvoiceWhereInput = {};

    const money = moneyStatus ? parseInvoiceMoneyStatus(moneyStatus) : null;
    if (moneyStatus && !money) {
      throw new BadRequestException(`Unknown invoice moneyStatus: ${moneyStatus}`);
    }
    if (money) where.moneyStatus = money;
    if (type) where.type = type as InvoiceTypeEnum;
    if (projectId) where.projectId = projectId;
    if (subscriptionId) where.subscriptionId = subscriptionId;

    const searchTrimmed = search?.trim();
    if (searchTrimmed) {
      const projectMatches = await this.prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTrimmed, mode: 'insensitive' } },
            { code: { contains: searchTrimmed, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const matchedProjectIds = projectMatches.map((p) => p.id);
      const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { code: ic },
            { govInvoiceId: ic },
            { company: { name: ic } },
            {
              order: {
                OR: [
                  { code: ic },
                  { deal: { name: ic } },
                  { deal: { code: ic } },
                  { project: { name: ic } },
                  { project: { code: ic } },
                  { product: { name: ic } },
                  { extension: { name: ic } },
                ],
              },
            },
            {
              subscription: {
                OR: [{ code: ic }, { project: { name: ic } }, { project: { code: ic } }],
              },
            },
            ...(matchedProjectIds.length > 0 ? [{ projectId: { in: matchedProjectIds } }] : []),
          ],
        },
      ];
    }

    const createdAt = buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          order: {
            select: INVOICE_ORDER_SELECT,
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
          project: resolveInvoiceProjectRow(invoice),
        }),
      ),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        project: true,
        order: { include: INVOICE_ORDER_DETAIL_INCLUDE },
        subscription: { include: { project: true } },
        company: true,
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return attachInvoicePaymentCoverage({
      ...invoice,
      project: resolveInvoiceProjectRow(invoice),
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
    const type = await resolveCreateInvoiceType(this.prisma, data);
    const due = resolveInvoiceDueDate(data.dueDate);
    const bookedAt = due;
    await assertPostingPeriodOpenForBookedAt(this.prisma, bookedAt);

    const invoice = await this.prisma.invoice.create({
      data: {
        code,
        orderId: data.orderId,
        subscriptionId: data.subscriptionId,
        projectId: data.projectId?.trim() || null,
        companyId: data.companyId,
        clientServiceRecordId: data.clientServiceRecordId,
        amount: data.amount,
        taxStatus,
        type,
        dueDate: due,
        ...(data.subscriptionId && type === 'SUBSCRIPTION'
          ? {
              coverageStartMonth: financeCalendarMonthKey(due),
              coverageMonthCount: 1,
            }
          : {}),
      },
    });

    const order = data.orderId
      ? await this.prisma.order.findUnique({
          where: { id: data.orderId },
          select: { productId: true },
        })
      : null;

    await this.operationalJournal.appendInvoiceCardAccrualLine({
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      amount: data.amount,
      bookedAt,
      companyId: data.companyId ?? null,
      projectId: data.projectId?.trim() || null,
      productId: order?.productId ?? null,
      orderId: data.orderId ?? null,
    });

    return this.findById(invoice.id);
  }

  /** Updates invoice amount and/or tax status on the card. */
  async updateGeneral(id: string, body: UpdateInvoiceGeneralInput) {
    const input = parseUpdateInvoiceGeneralInput(body);
    await applyInvoiceGeneralUpdate(this.prisma, id, input);
    return this.findById(id);
  }

  /**
   * Sets the canonical Invoice Card money status (`Invoice.moneyStatus`).
   */
  async updateMoneyStatus(id: string, moneyStatusRaw: string) {
    const moneyStatus = parseInvoiceMoneyStatus(moneyStatusRaw);
    if (!moneyStatus) {
      throw new BadRequestException(`Unknown invoice moneyStatus: ${moneyStatusRaw}`);
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        amount: true,
        dueDate: true,
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
    const now = new Date();
    const derivedBase = deriveBaseInvoiceMoneyStatus({
      amount,
      paid,
      dueDate: invoice.dueDate,
      now,
    });

    this.assertManualMoneyStatusAllowed(moneyStatus, derivedBase);

    const updateData: Prisma.InvoiceUpdateInput = {
      moneyStatus,
    };
    if (moneyStatus === 'PAID') {
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

    if (moneyStatus === 'PAID' && invoice.orderId) {
      await this.checkAndPromoteDeal(invoice.orderId);
    }

    return this.findById(id);
  }

  private async checkAndPromoteDeal(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deal: true,
        invoices: { select: { moneyStatus: true, amount: true } },
      },
    });
    if (!order?.deal || order.deal.status === 'WON' || order.deal.status === 'FAILED') return;

    const allPaid =
      order.invoices.length > 0 && order.invoices.every((inv) => inv.moneyStatus === 'PAID');
    if (!allPaid) return;

    const paidTotal = order.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const dealAmount = Number(order.deal.amount ?? 0);

    if (dealAmount > 0 && paidTotal >= dealAmount) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: order.deal.id },
        include: dealDetailInclude,
      });
      if (!deal) return;
      await this.prisma.deal.update({
        where: { id: deal.id },
        data: { status: 'WON', wonMode: 'STANDARD' },
      });
      await this.dealWonHandler.handle(deal);
    }
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.invoice.delete({ where: { id } });
  }

  async sendOfficialInvoiceRequest(id: string) {
    await sendOfficialInvoiceRequest(this.prisma, id);
    return this.findById(id);
  }

  async cancelOfficialInvoiceRequest(id: string) {
    await cancelOfficialInvoiceRequest(this.prisma, id);
    return this.findById(id);
  }

  async updateOfficialInvoiceGovId(id: string, govInvoiceId: string | null) {
    await updateOfficialInvoiceGovId(this.prisma, id, govInvoiceId);
    return this.findById(id);
  }

  private assertManualMoneyStatusAllowed(
    requested: InvoiceMoneyStatusEnum,
    derivedBase: InvoiceMoneyStatusEnum,
  ) {
    if (requested === 'PAID' && derivedBase !== 'PAID') {
      throw new BadRequestException('Cannot mark invoice as paid before payments fully cover it');
    }

    if (derivedBase === 'PAID' && requested !== 'PAID') {
      throw new BadRequestException('Fully paid invoices must stay in PAID money status');
    }
  }

  private assertCreateInvoiceInput(data: CreateInvoiceDto) {
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
