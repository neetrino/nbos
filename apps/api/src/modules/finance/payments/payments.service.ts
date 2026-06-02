import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { NotificationService } from '../../notifications/notification.service';
import { SalesBonusAccrualService } from '../../bonus/sales-bonus-accrual.service';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { getLatestPaymentDate, resolveOrderStatus, sumAmounts } from '../finance-status.utils';
import { syncInvoiceMoneyStatusFromPayments } from '../invoices/invoice-money-status';
import { OperationalJournalService } from '../journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../journal/posting-period-guard';
import { PartnerAccrualClassicService } from '../partner-accrual/partner-accrual-classic.service';
import { PartnerAccrualSubscriptionService } from '../partner-accrual/partner-accrual-subscription.service';
import { ClientPaidInvoiceAutomationService } from '../../client-services/client-paid-invoice-automation.service';
import { refreshSalesKpiAfterClientPayment } from '../../payroll-runs/sales-kpi-event-refresh';
import { mergeFinanceWhere } from '../finance-scoped-access';
import type { FinanceScopedAccessContext } from '../finance-scoped-access';
import { resolvePaymentParticipationWhere } from '../finance-module-participation.where';

interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  confirmedBy?: string;
  notes?: string;
}

interface PaymentQueryParams {
  page?: number;
  pageSize?: number;
  invoiceId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  access?: FinanceScopedAccessContext;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly salesBonusAccrual: SalesBonusAccrualService,
    private readonly notifications: NotificationService,
    private readonly operationalJournal: OperationalJournalService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
    private readonly partnerAccrualSubscription: PartnerAccrualSubscriptionService,
    private readonly clientPaidInvoiceAutomation: ClientPaidInvoiceAutomationService,
  ) {}

  async findAll(params: PaymentQueryParams) {
    const { page = 1, pageSize = 20, invoiceId, search, dateFrom, dateTo } = params;
    const parts: Prisma.PaymentWhereInput[] = [];

    if (invoiceId) parts.push({ invoiceId });
    const searchTrimmed = search?.trim();
    if (searchTrimmed) {
      const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
      parts.push({
        OR: [
          { notes: ic },
          {
            invoice: {
              OR: [
                { code: ic },
                { company: { name: ic } },
                {
                  order: {
                    OR: [{ code: ic }, { project: { name: ic } }, { project: { code: ic } }],
                  },
                },
                {
                  subscription: {
                    OR: [{ code: ic }, { project: { name: ic } }, { project: { code: ic } }],
                  },
                },
              ],
            },
          },
        ],
      });
    }
    if (dateFrom || dateTo) {
      parts.push({
        paymentDate: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      });
    }

    const baseWhere: Prisma.PaymentWhereInput =
      parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };
    const participationWhere = await resolvePaymentParticipationWhere(this.prisma, params.access);
    const where = mergeFinanceWhere(baseWhere, participationWhere);

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              code: true,
              amount: true,
              moneyStatus: true,
              type: true,
              projectId: true,
              company: { select: { id: true, name: true } },
              order: {
                select: {
                  project: { select: { id: true, name: true } },
                },
              },
              subscription: {
                select: {
                  project: { select: { id: true, name: true } },
                },
              },
            },
          },
          confirmer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((payment) => ({
        ...payment,
        project:
          payment.invoice?.order?.project ??
          payment.invoice?.subscription?.project ??
          (payment.invoice ? { id: payment.invoice.projectId, name: 'Unknown project' } : null),
        company: payment.invoice?.company ?? null,
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            company: { select: { id: true, name: true } },
            order: {
              select: { id: true, code: true, project: { select: { id: true, name: true } } },
            },
            subscription: {
              select: { id: true, code: true, project: { select: { id: true, name: true } } },
            },
          },
        },
        confirmer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return {
      ...payment,
      project: payment.invoice.order?.project ??
        payment.invoice.subscription?.project ?? {
          id: payment.invoice.projectId,
          name: 'Unknown project',
        },
      company: payment.invoice.company ?? null,
    };
  }

  async create(data: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      select: {
        id: true,
        code: true,
        orderId: true,
        projectId: true,
        companyId: true,
        amount: true,
        moneyStatus: true,
        dueDate: true,
        payments: { select: { amount: true } },
        order: { select: { productId: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${data.invoiceId} not found`);

    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const currentPaid = sumAmounts(invoice.payments);
    const nextPaid = currentPaid + data.amount;
    const invoiceAmount = Number(invoice.amount);

    if (invoice.moneyStatus === 'PAID' || currentPaid >= invoiceAmount) {
      throw new BadRequestException(`Invoice ${data.invoiceId} is already fully paid`);
    }

    if (nextPaid > invoiceAmount) {
      throw new BadRequestException(
        `Payment amount exceeds outstanding invoice balance of ${invoiceAmount - currentPaid}`,
      );
    }

    const paymentDate = new Date(data.paymentDate);
    await assertPostingPeriodOpenForBookedAt(this.prisma, paymentDate);
    const created = await this.prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentDate,
        paymentMethod: data.paymentMethod,
        confirmedBy: data.confirmedBy,
        notes: data.notes,
      },
    });

    await this.operationalJournal.appendCashPaymentLine({
      paymentId: created.id,
      invoiceCode: invoice.code,
      amount: data.amount,
      bookedAt: paymentDate,
      companyId: invoice.companyId,
      projectId: invoice.projectId,
      productId: invoice.order?.productId,
      orderId: invoice.orderId,
    });

    await this.syncInvoiceStatus(data.invoiceId);

    await refreshSalesKpiAfterClientPayment(this.prisma, {
      invoiceId: data.invoiceId,
      paymentDate,
    });

    if (invoice.orderId) {
      await this.syncOrderStatus(invoice.orderId);
      await syncProductBonusPoolForOrder(this.prisma, invoice.orderId, this.notifications);
      const ord = await this.prisma.order.findUnique({
        where: { id: invoice.orderId },
        select: { status: true },
      });
      if (ord?.status === 'FULLY_PAID') {
        await this.partnerAccrualClassic.tryInboundClassicAfterClientPayment({
          orderId: invoice.orderId,
          paymentId: created.id,
          invoiceId: data.invoiceId,
        });
      }
    }

    const refreshed = await this.prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      select: { moneyStatus: true },
    });
    if (refreshed?.moneyStatus === 'PAID') {
      await this.salesBonusAccrual.onInvoicePaid(data.invoiceId);
      await this.partnerAccrualSubscription.tryInboundSubscriptionAfterClientPayment({
        invoiceId: data.invoiceId,
        paymentId: created.id,
      });
      await this.clientPaidInvoiceAutomation.onInvoiceFullyPaid({
        invoiceId: data.invoiceId,
        actorEmployeeId: data.confirmedBy,
      });
    }

    return this.findById(created.id);
  }

  async delete(id: string) {
    const payment = await this.findById(id);
    await assertPostingPeriodOpenForBookedAt(this.prisma, payment.paymentDate);
    await this.prisma.payment.delete({ where: { id } });

    await this.syncInvoiceStatus(payment.invoiceId);
    if (payment.invoice.orderId) {
      await this.syncOrderStatus(payment.invoice.orderId);
      await syncProductBonusPoolForOrder(this.prisma, payment.invoice.orderId, this.notifications);
    }
  }

  async getStats(params: Pick<PaymentQueryParams, 'dateFrom' | 'dateTo' | 'access'> = {}) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const paymentDate = this.buildDateRange(params.dateFrom, params.dateTo);
    const monthScopedPaymentDate = this.buildMonthScopedDateRange(paymentDate, monthStart);
    const participationWhere = await resolvePaymentParticipationWhere(this.prisma, params.access);
    const dateWhere: Prisma.PaymentWhereInput = paymentDate ? { paymentDate } : {};
    const scopedDateWhere = mergeFinanceWhere(dateWhere, participationWhere);
    const scopedMonthWhere = mergeFinanceWhere(
      { paymentDate: monthScopedPaymentDate } satisfies Prisma.PaymentWhereInput,
      participationWhere,
    );

    const [totalPayments, totalCollected, thisMonthCollected] = await Promise.all([
      this.prisma.payment.count({
        ...(Object.keys(scopedDateWhere).length > 0 ? { where: scopedDateWhere } : {}),
      }),
      this.prisma.payment.aggregate({
        ...(Object.keys(scopedDateWhere).length > 0 ? { where: scopedDateWhere } : {}),
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: scopedMonthWhere,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      totalCollected: totalCollected._sum.amount,
      thisMonthCollected: thisMonthCollected._sum.amount,
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

  private buildMonthScopedDateRange(
    paymentDate: Prisma.DateTimeFilter | undefined,
    monthStart: Date,
  ): Prisma.DateTimeFilter {
    const dateFrom = paymentDate?.gte instanceof Date ? paymentDate.gte : undefined;
    const dateTo = paymentDate?.lte instanceof Date ? paymentDate.lte : undefined;
    const effectiveStart = dateFrom && dateFrom > monthStart ? dateFrom : monthStart;

    return {
      gte: effectiveStart,
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  private async syncInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        amount: true,
        dueDate: true,
        moneyStatus: true,
        payments: { select: { amount: true, paymentDate: true } },
      },
    });
    if (!invoice) return;

    const paid = sumAmounts(invoice.payments);
    const amount = Number(invoice.amount);
    const now = new Date();
    const moneyStatus = syncInvoiceMoneyStatusFromPayments({
      currentMoneyStatus: invoice.moneyStatus,
      amount,
      paid,
      dueDate: invoice.dueDate,
      now,
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        moneyStatus,
        paidDate: moneyStatus === 'PAID' ? getLatestPaymentDate(invoice.payments) : null,
      },
    });
  }

  private async syncOrderStatus(orderId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orderId },
      select: {
        moneyStatus: true,
        amount: true,
        payments: { select: { amount: true } },
      },
    });
    if (invoices.length === 0) return;

    const status = resolveOrderStatus(invoices);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
