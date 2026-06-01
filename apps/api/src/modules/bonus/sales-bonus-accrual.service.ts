import { Injectable, Inject, Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue, type LeadSourceEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import { decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';
import {
  hasRecurringSalesAccrualForInvoiceEmployee,
  hasSalesAccrualForInvoice,
  hasSlottedSalesBonusOnOrder,
} from './sales-bonus-accrual-idempotency';
import { buildSalesBonusAmountRows, persistSalesBonusRows } from './sales-bonus-accrual-rows';
import {
  earnedPeriodFromUtcDate,
  refreshSalesBonusesForEmployeesEarnedMonth,
} from './sales-bonus-kpi-payable';

type SlottedPaymentModel = 'CLASSIC' | 'SUBSCRIPTION_FIRST_MONTH';
type PolicyPaymentModel = SlottedPaymentModel | 'SUBSCRIPTION_RECURRING';

type AccrualBasis = 'ORDER_TOTAL' | 'FIRST_PAID_INVOICE_AMOUNT' | 'SUBSCRIPTION_RECURRING_INVOICE';

type AccrualDeal = {
  id: string;
  source: LeadSourceEnum;
  sellerId: string;
  sellerAssistantId: string | null;
};

type AccrualOrder = {
  id: string;
  projectId: string;
  totalAmount: Decimal;
  paymentType: string;
  dealId: string;
  deal: AccrualDeal;
};

@Injectable()
export class SalesBonusAccrualService {
  private readonly logger = new Logger(SalesBonusAccrualService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Called when an invoice is fully PAID. Classic: one seller + assistant wave per order.
   * Subscription: first paid invoice uses first-month policy; later paid invoices use
   * `SUBSCRIPTION_RECURRING` (idempotent per invoice via `salesAccrualInvoiceId`).
   */
  async onInvoicePaid(invoiceId: string): Promise<void> {
    try {
      const orderIdToSync = await this.runAccrual(invoiceId);
      if (orderIdToSync) {
        await syncProductBonusPoolForOrder(this.prisma, orderIdToSync, this.notifications);
      }
    } catch (err) {
      this.logger.error(
        { err, invoiceId, message: err instanceof Error ? err.message : String(err) },
        'Sales bonus accrual failed',
      );
    }
  }

  /** @returns order id when bonus rows were created and product pool should sync. */
  private async runAccrual(invoiceId: string): Promise<string | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        paidDate: true,
        moneyStatus: true,
        amount: true,
        orderId: true,
        order: {
          select: {
            id: true,
            projectId: true,
            totalAmount: true,
            paymentType: true,
            paymentMode: true,
            dealId: true,
            deal: {
              select: {
                id: true,
                source: true,
                sellerId: true,
                sellerAssistantId: true,
              },
            },
          },
        },
      },
    });

    if (!invoice || invoice.moneyStatus !== 'PAID' || !invoice.orderId || !invoice.order) {
      return null;
    }

    const raw = invoice.order;
    if (raw.paymentMode === 'FREE') {
      return null;
    }
    if (!raw.dealId || !raw.deal || !raw.deal.source) {
      if (raw.deal && !raw.deal.source) {
        this.logger.warn(
          { dealId: raw.deal.id, orderId: raw.id },
          'Skipping sales bonus: Deal has no From (source)',
        );
      }
      return null;
    }

    const order: AccrualOrder = {
      id: raw.id,
      projectId: raw.projectId,
      totalAmount: decimalFrom(raw.totalAmount),
      paymentType: raw.paymentType,
      dealId: raw.dealId,
      deal: {
        id: raw.deal.id,
        source: raw.deal.source,
        sellerId: raw.deal.sellerId,
        sellerAssistantId: raw.deal.sellerAssistantId,
      },
    };

    const earnedPeriod =
      invoice.paidDate != null
        ? earnedPeriodFromUtcDate(invoice.paidDate)
        : earnedPeriodFromUtcDate(new Date());
    const invoiceCore = { id: invoice.id, amount: decimalFrom(invoice.amount) };

    let created = false;
    if (order.paymentType === 'SUBSCRIPTION') {
      created = await this.runSubscriptionAccrual(invoiceCore, order, earnedPeriod);
    } else {
      created = await this.runSlottedAccrual(invoiceCore, order, 'CLASSIC', earnedPeriod, {
        baseAmount: order.totalAmount,
        basis: 'ORDER_TOTAL',
      });
    }

    const deal = order.deal;
    await refreshSalesBonusesForEmployeesEarnedMonth(
      this.prisma,
      [deal.sellerId, deal.sellerAssistantId ?? ''].filter(Boolean),
      earnedPeriod,
    );

    return created ? order.id : null;
  }

  private async runSubscriptionAccrual(
    invoice: { id: string; amount: Decimal },
    order: AccrualOrder,
    earnedPeriod: string,
  ): Promise<boolean> {
    const firstMonthDone = await hasSlottedSalesBonusOnOrder(this.prisma, order.id);
    if (!firstMonthDone) {
      return this.runSlottedAccrual(invoice, order, 'SUBSCRIPTION_FIRST_MONTH', earnedPeriod, {
        baseAmount: decimalFrom(invoice.amount),
        basis: 'FIRST_PAID_INVOICE_AMOUNT',
      });
    }
    return this.runSubscriptionRecurringAccrual(invoice, order, earnedPeriod);
  }

  private async runSubscriptionRecurringAccrual(
    invoice: { id: string; amount: Decimal },
    order: AccrualOrder,
    earnedPeriod: string,
  ): Promise<boolean> {
    const policy = await this.loadPolicy(order.deal.source, 'SUBSCRIPTION_RECURRING');
    if (!policy) {
      this.logger.warn(
        { from: order.deal.source, paymentModel: 'SUBSCRIPTION_RECURRING', dealId: order.deal.id },
        'No active sales bonus policy row',
      );
      return false;
    }

    if (policy.sellerPercent.eq(0) && policy.assistantPercent.eq(0)) {
      return false;
    }

    const baseAmount = decimalFrom(invoice.amount);
    const snapshot = {
      fromCategory: order.deal.source,
      paymentModel: 'SUBSCRIPTION_RECURRING' as const,
      sellerPercent: Number(policy.sellerPercent),
      assistantPercent: Number(policy.assistantPercent),
      baseAmount: baseAmount.toString(),
      invoiceId: invoice.id,
      orderId: order.id,
      dealId: order.deal.id,
      basis: 'SUBSCRIPTION_RECURRING_INVOICE' as const,
    };

    const rows = buildSalesBonusAmountRows(order.deal, policy, baseAmount);
    const rowsToCreate = [];
    for (const row of rows) {
      const exists = await hasRecurringSalesAccrualForInvoiceEmployee(
        this.prisma,
        order.id,
        invoice.id,
        row.employeeId,
      );
      if (!exists) {
        rowsToCreate.push(row);
      }
    }
    if (rowsToCreate.length === 0) {
      return false;
    }

    const snapshotJson = snapshot as InputJsonValue;
    return persistSalesBonusRows(
      this.prisma,
      order,
      order.deal,
      rowsToCreate,
      snapshotJson,
      invoice.id,
      null,
      earnedPeriod,
    );
  }

  private async loadPolicy(
    fromCategory: LeadSourceEnum,
    paymentModel: PolicyPaymentModel,
  ): Promise<{ sellerPercent: Decimal; assistantPercent: Decimal } | null> {
    const policy = await this.prisma.salesBonusPolicy.findFirst({
      where: {
        fromCategory,
        paymentModel,
        isActive: true,
        effectiveFrom: { lte: new Date() },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!policy) return null;
    return {
      sellerPercent: new Decimal(policy.sellerPercent),
      assistantPercent: new Decimal(policy.assistantPercent),
    };
  }

  private async runSlottedAccrual(
    invoice: { id: string; amount: Decimal },
    order: AccrualOrder,
    paymentModel: SlottedPaymentModel,
    earnedPeriod: string,
    params: { baseAmount: Decimal; basis: AccrualBasis },
  ): Promise<boolean> {
    if (await hasSalesAccrualForInvoice(this.prisma, order.id, invoice.id)) {
      return false;
    }
    if (await hasSlottedSalesBonusOnOrder(this.prisma, order.id)) {
      return false;
    }

    const policy = await this.loadPolicy(order.deal.source, paymentModel);
    if (!policy) {
      this.logger.warn(
        { from: order.deal.source, paymentModel, dealId: order.deal.id },
        'No active sales bonus policy row',
      );
      return false;
    }

    const snapshot = {
      fromCategory: order.deal.source,
      paymentModel,
      sellerPercent: Number(policy.sellerPercent),
      assistantPercent: Number(policy.assistantPercent),
      baseAmount: params.baseAmount.toString(),
      invoiceId: invoice.id,
      orderId: order.id,
      dealId: order.deal.id,
      basis: params.basis,
    };

    const rows = buildSalesBonusAmountRows(order.deal, policy, params.baseAmount);
    if (rows.length === 0) {
      return false;
    }

    const snapshotJson = snapshot as InputJsonValue;
    return persistSalesBonusRows(
      this.prisma,
      order,
      order.deal,
      rows,
      snapshotJson,
      invoice.id,
      'slot',
      earnedPeriod,
    );
  }
}
