import { Injectable, Inject, Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue, type LeadSourceEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import { decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';
import { notifyFinanceBonusViewersOfAccrualHold } from './sales-bonus-accrual-hold-notify';
import {
  reportSalesAccrualHold,
  SALES_ACCRUAL_HOLD_REASON,
  type SalesAccrualHoldNotify,
} from './sales-bonus-accrual-hold';
import {
  hasSlottedSalesAccrualForInvoice,
  hasSlottedSalesBonusOnOrder,
} from './sales-bonus-accrual-idempotency';
import { loadPaidSalesBonusInvoice } from './sales-bonus-accrual-invoice-load';
import { persistLockedCappedSalesBonusRows } from './sales-bonus-order-accrual-write';
import { accrueClassicOneTimeSalesBonus } from './sales-bonus-classic-one-time';
import { loadSalesBonusPolicyAtEvent } from './sales-bonus-policy-at-event';
import { isExcludedFromSalesAccrual } from './sales-bonus-qualifying-invoice';
import { salesBonusEarnedPeriod, salesBonusReceiptEventAt } from './sales-bonus-receipt-event';
import { accrueSubscriptionRecurringSalesBonus } from './sales-bonus-subscription-recurring';
import { refreshSalesBonusesForEmployeesEarnedMonth } from './sales-bonus-kpi-payable';
import { subscriptionFirstMonthBonusBase } from './subscription-first-month-bonus-base';

type SlottedPaymentModel = 'CLASSIC' | 'SUBSCRIPTION_FIRST_MONTH';
type PolicyPaymentModel = SlottedPaymentModel | 'SUBSCRIPTION_RECURRING';
type AccrualBasis = 'ORDER_TOTAL' | 'FIRST_PAID_MONTH' | 'SUBSCRIPTION_RECURRING_INVOICE';
type PaidAccrualInvoice = NonNullable<Awaited<ReturnType<typeof loadPaidSalesBonusInvoice>>>;

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
   * Subscription: first paid invoice uses one month of that invoice and the first-month
   * policy, once; later paid invoices use `SUBSCRIPTION_RECURRING`.
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
    const invoice = await loadPaidSalesBonusInvoice(this.prisma, invoiceId);
    if (!invoice) {
      return null;
    }
    const order = this.toAccrualOrder(invoice);
    if (!order) {
      return null;
    }
    const receiptAt = salesBonusReceiptEventAt(invoice);
    if (receiptAt == null) {
      await reportSalesAccrualHold(this.logger, this.notifyHold, {
        reason: SALES_ACCRUAL_HOLD_REASON.MISSING_RECEIPT_EVENT,
        invoiceId: invoice.id,
        orderId: order.id,
      });
      return null;
    }
    const earnedPeriod = salesBonusEarnedPeriod(receiptAt);
    const created = await this.accrueForPaymentType(invoice, order, receiptAt, earnedPeriod);
    await refreshSalesBonusesForEmployeesEarnedMonth(
      this.prisma,
      [order.deal.sellerId, order.deal.sellerAssistantId ?? ''].filter(Boolean),
      earnedPeriod,
    );
    return created ? order.id : null;
  }

  private toAccrualOrder(invoice: PaidAccrualInvoice): AccrualOrder | null {
    const raw = invoice.order;
    if (!raw || raw.paymentMode === 'FREE') {
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
    return {
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
  }

  private async accrueForPaymentType(
    invoice: PaidAccrualInvoice,
    order: AccrualOrder,
    receiptAt: Date,
    earnedPeriod: string,
  ): Promise<boolean> {
    if (isExcludedFromSalesAccrual(invoice.type)) {
      return false;
    }
    const invoiceCore = {
      id: invoice.id,
      amount: decimalFrom(invoice.amount),
      coverageMonthCount: invoice.coverageMonthCount,
      periodAmount:
        invoice.order?.deal?.amount == null ? null : decimalFrom(invoice.order.deal.amount),
    };
    if (order.paymentType === 'SUBSCRIPTION') {
      return this.runSubscriptionAccrual(invoiceCore, order, receiptAt, earnedPeriod);
    }
    return accrueClassicOneTimeSalesBonus({
      prisma: this.prisma,
      logger: this.logger,
      notifyHold: this.notifyHold,
      invoice: { id: invoice.id, amount: decimalFrom(invoice.amount), type: invoice.type },
      order,
      receiptAt,
      earnedPeriod,
    });
  }

  private async runSubscriptionAccrual(
    invoice: {
      id: string;
      amount: Decimal;
      coverageMonthCount: number | null;
      periodAmount: Decimal | null;
    },
    order: AccrualOrder,
    receiptAt: Date,
    earnedPeriod: string,
  ): Promise<boolean> {
    const firstMonthStarted = await hasSlottedSalesBonusOnOrder(this.prisma, order.id);
    const thisInvoiceHasSlottedRow = await hasSlottedSalesAccrualForInvoice(
      this.prisma,
      order.id,
      invoice.id,
    );
    if (!firstMonthStarted || thisInvoiceHasSlottedRow) {
      const baseAmount = subscriptionFirstMonthBonusBase({
        invoiceAmount: invoice.amount,
        coverageMonthCount: invoice.coverageMonthCount,
        periodAmount: invoice.periodAmount,
      });
      return this.runSlottedAccrual(
        invoice,
        order,
        'SUBSCRIPTION_FIRST_MONTH',
        receiptAt,
        earnedPeriod,
        {
          baseAmount,
          basis: 'FIRST_PAID_MONTH',
        },
      );
    }
    return accrueSubscriptionRecurringSalesBonus({
      prisma: this.prisma,
      logger: this.logger,
      invoice,
      order,
      earnedPeriod,
      loadPolicy: (fromCategory, paymentModel) =>
        this.loadPolicy(fromCategory, paymentModel, receiptAt, invoice.id),
    });
  }

  private async loadPolicy(
    fromCategory: LeadSourceEnum,
    paymentModel: PolicyPaymentModel,
    at: Date,
    invoiceId: string,
  ): Promise<{ sellerPercent: Decimal; assistantPercent: Decimal } | null> {
    const loaded = await loadSalesBonusPolicyAtEvent(this.prisma, {
      fromCategory,
      paymentModel,
      at,
    });
    if (loaded.status === 'ambiguous') {
      await reportSalesAccrualHold(this.logger, this.notifyHold, {
        reason: SALES_ACCRUAL_HOLD_REASON.AMBIGUOUS_SALES_POLICY,
        invoiceId,
        fromCategory,
        paymentModel,
      });
      return null;
    }
    if (loaded.status === 'missing') {
      return null;
    }
    return {
      sellerPercent: loaded.policy.sellerPercent,
      assistantPercent: loaded.policy.assistantPercent,
    };
  }

  private async runSlottedAccrual(
    invoice: { id: string; amount: Decimal },
    order: AccrualOrder,
    paymentModel: SlottedPaymentModel,
    receiptAt: Date,
    earnedPeriod: string,
    params: { baseAmount: Decimal; basis: AccrualBasis },
  ): Promise<boolean> {
    const policy = await this.loadPolicy(order.deal.source, paymentModel, receiptAt, invoice.id);
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
      receiptEventAt: receiptAt.toISOString(),
      earnedPeriod,
      baseAmount: params.baseAmount.toString(),
      invoiceId: invoice.id,
      orderId: order.id,
      dealId: order.deal.id,
      basis: params.basis,
    };

    return persistLockedCappedSalesBonusRows({
      prisma: this.prisma,
      order,
      deal: order.deal,
      policy,
      baseAmount: params.baseAmount,
      snapshotJson: snapshot as InputJsonValue,
      invoiceId: invoice.id,
      slotMode: 'slot',
      earnedPeriod,
    });
  }

  private readonly notifyHold: SalesAccrualHoldNotify = (details) =>
    notifyFinanceBonusViewersOfAccrualHold(this.prisma, this.notifications, details);
}
