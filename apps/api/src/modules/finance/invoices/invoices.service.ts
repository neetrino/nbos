import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { shouldCancelOfficialRequestOnCardCancel } from '@nbos/shared';
import {
  PrismaClient,
  type Prisma,
  type InvoiceTypeEnum,
  type InvoiceMoneyStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  getLatestPaymentDate,
  sumAmounts,
  type FinanceAmountCarrier,
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
  MARK_PAID_AUTO_PAYMENT_METHOD,
  MARK_PAID_AUTO_PAYMENT_NOTE,
  PAYMENTS_SERVICE_TOKEN,
  markPaidPaymentDateIso,
  type MarkPaidPaymentsPort,
} from './invoice-mark-paid-settle';
import { deriveBaseInvoiceMoneyStatus, parseInvoiceMoneyStatus } from './invoice-money-status';
import { DealWonHandler } from '../../crm/deals/deal-won.handler';
import { dealDetailInclude } from '../../crm/deals/deal.includes';
import {
  cancelOfficialInvoiceRequest,
  sendOfficialInvoiceRequest,
  updateOfficialInvoiceGovId,
} from './invoice-official-request';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';
import {
  INVOICE_MONEY_STATUS_TRANSITION_SELECT,
  prepareInvoiceMoneyStatusTransition,
} from './invoice-money-status-transition';
import { OperationalJournalService } from '../journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../journal/posting-period-guard';
import {
  applyInvoiceGeneralUpdate,
  parseUpdateInvoiceGeneralInput,
  type UpdateInvoiceGeneralInput,
} from './invoice-general-update';
import { resolveCreateInvoiceType } from './invoice-create-resolver';
import { resolveInvoiceCreateSchedule } from './invoice-subscription-create-schedule';
import { resolveInvoiceProjectRow } from './invoice-project-resolve';
import { INVOICE_ORDER_DETAIL_INCLUDE, INVOICE_ORDER_SELECT } from './invoice-order-select';
import type { FinanceInvoiceAccessContext } from './finance-invoice-access';
import {
  mergeInvoiceWhere,
  resolveInvoiceParticipationWhere,
} from './finance-invoice-participation.where';
import { buildInvoiceSearchOr } from './invoice-search.where';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';
import {
  assertInvoiceCancellable,
  assertInvoiceDraftDeletable,
  invoiceAccrualJournalKey,
} from '../../../common/lifecycle/finance-record-lifecycle-guards';

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
  access?: FinanceInvoiceAccessContext;
}

interface InvoiceStatsParams {
  dateFrom?: string;
  dateTo?: string;
  subscriptionId?: string;
  access?: FinanceInvoiceAccessContext;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly dealWonHandler: DealWonHandler,
    private readonly operationalJournal: OperationalJournalService,
    private readonly moduleRef: ModuleRef,
    @Optional() private readonly officialWhatsApp?: InvoiceOfficialWhatsAppService,
  ) {}

  private resolvePaymentsService(): MarkPaidPaymentsPort {
    return this.moduleRef.get<MarkPaidPaymentsPort>(PAYMENTS_SERVICE_TOKEN, { strict: false });
  }

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
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        buildInvoiceSearchOr(searchTrimmed, matchedProjectIds),
      ];
    }

    const createdAt = buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const participationWhere = await resolveInvoiceParticipationWhere(this.prisma, params.access);
    const listWhere = mergeInvoiceWhere(where, participationWhere);

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: listWhere,
        include: {
          project: { select: { id: true, name: true } },
          order: {
            select: INVOICE_ORDER_SELECT,
          },
          subscription: {
            select: {
              id: true,
              code: true,
              name: true,
              project: { select: { id: true, name: true } },
            },
          },
          company: { select: { id: true, name: true, legalName: true, taxId: true } },
          payments: { select: { id: true, amount: true, paymentDate: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where: listWhere }),
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
    const code = await allocateInvoiceCode(this.prisma);
    const taxStatus = await resolveInvoiceTaxStatus(this.prisma, data);
    const type = await resolveCreateInvoiceType(this.prisma, data);
    const schedule = await resolveInvoiceCreateSchedule(this.prisma, {
      subscriptionId: data.subscriptionId,
      dueDate: data.dueDate,
      type,
    });
    const bookedAt = schedule.dueDate;
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
        dueDate: schedule.dueDate,
        ...(data.subscriptionId && type === 'SUBSCRIPTION'
          ? {
              coverageStartMonth: schedule.coverageStartMonth,
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
      select: INVOICE_MONEY_STATUS_TRANSITION_SELECT,
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    if (moneyStatus === 'CANCELLED' && shouldCancelOfficialRequestOnCardCancel(invoice)) {
      await this.officialWhatsApp?.enqueueCancelBestEffort(id);
    }

    await prepareInvoiceMoneyStatusTransition(this.prisma, invoice, moneyStatus);

    const amount = Number(invoice.amount);
    const paid = sumAmounts(invoice.payments);
    const now = new Date();
    const outstanding = Math.max(0, amount - paid);

    if (moneyStatus === 'PAID' && outstanding > 0) {
      await this.resolvePaymentsService().create({
        invoiceId: id,
        amount: outstanding,
        paymentDate: markPaidPaymentDateIso(now),
        paymentMethod: MARK_PAID_AUTO_PAYMENT_METHOD,
        notes: MARK_PAID_AUTO_PAYMENT_NOTE,
      });
      if (invoice.orderId) {
        await this.checkAndPromoteDeal(invoice.orderId);
      }
      return this.findById(id);
    }

    await this.writeManualMoneyStatus(invoice, moneyStatus, amount, paid, now);
    return this.findById(id);
  }

  private async writeManualMoneyStatus(
    invoice: {
      id: string;
      orderId: string | null;
      dueDate: Date | null;
      payments: Array<FinanceAmountCarrier & { paymentDate: Date }>;
    },
    moneyStatus: InvoiceMoneyStatusEnum,
    amount: number,
    paid: number,
    now: Date,
  ) {
    const derivedBase = deriveBaseInvoiceMoneyStatus({
      amount,
      paid,
      dueDate: invoice.dueDate,
      now,
    });
    this.assertManualMoneyStatusAllowed(moneyStatus, derivedBase);
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        moneyStatus,
        paidDate: moneyStatus === 'PAID' ? (getLatestPaymentDate(invoice.payments) ?? now) : null,
      },
    });
    if (!invoice.orderId) return;
    await syncInvoiceOrderStatus(this.prisma, invoice.orderId);
    if (moneyStatus === 'PAID') {
      await this.checkAndPromoteDeal(invoice.orderId);
    }
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

  async cancel(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: { moneyStatus: true, code: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    assertInvoiceCancellable(invoice);
    const updated = await this.updateMoneyStatus(id, 'CANCELLED');
    await this.operationalJournal.reverseJournalLineByIdempotencyKey(
      invoiceAccrualJournalKey(id),
      `Invoice ${invoice.code ?? id} cancelled`,
    );
    return updated;
  }

  async delete(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: {
        moneyStatus: true,
        code: true,
        _count: { select: { payments: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    assertInvoiceDraftDeletable({
      moneyStatus: invoice.moneyStatus,
      paymentCount: invoice._count.payments,
    });
    await this.operationalJournal.reverseJournalLineByIdempotencyKey(
      invoiceAccrualJournalKey(id),
      `Draft invoice ${invoice.code ?? id} deleted`,
    );
    return this.prisma.invoice.delete({ where: { id } });
  }

  async sendOfficialInvoiceRequest(id: string) {
    if (this.officialWhatsApp) {
      await this.officialWhatsApp.sendAndWait(id);
    } else {
      await sendOfficialInvoiceRequest(this.prisma, id);
    }
    return this.findById(id);
  }

  async cancelOfficialInvoiceRequest(id: string) {
    if (this.officialWhatsApp) {
      await this.officialWhatsApp.cancelAndWait(id);
    } else {
      await cancelOfficialInvoiceRequest(this.prisma, id);
    }
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
}
