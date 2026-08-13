import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { OperationalJournalService } from '../journal/operational-journal.service';
import { computeInboundPartnerAccrualAmount } from './partner-accrual-classic.ops';
import {
  hasInboundDeliveryCarrier,
  heldSubscriptionAccrualWhere,
  isDevelopmentSubscriptionType,
  shouldHoldSubscriptionAccrualUntilDelivery,
} from './partner-accrual-subscription.ops';

const referralTermsSelect = {
  id: true,
  partnerId: true,
  partnerPercent: true,
  dealType: true,
  paymentType: true,
} as const;

const inboundSubscriptionOrderSelect = {
  id: true,
  projectId: true,
  dealId: true,
  productId: true,
  extensionId: true,
  paymentType: true,
  deal: {
    select: {
      source: true,
      sourcePartnerId: true,
      partnerReferralTerms: { select: referralTermsSelect },
    },
  },
  product: { select: { status: true } },
  extension: { select: { status: true } },
} satisfies Prisma.OrderSelect;

type InboundSubscriptionOrder = Prisma.OrderGetPayload<{
  select: typeof inboundSubscriptionOrderSelect;
}>;

type PaidSubscriptionInvoice = {
  id: string;
  companyId: string | null;
  projectId: string;
  orderId: string | null;
  subscriptionId: string;
  subscription: { partnerId: string | null; type: string } | null;
};

/**
 * PAR-02: inbound referral accrual per paid subscription invoice (cash received on this payment).
 */
@Injectable()
export class PartnerAccrualSubscriptionService {
  private readonly logger = new Logger(PartnerAccrualSubscriptionService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly operationalJournal: OperationalJournalService,
  ) {}

  async tryInboundSubscriptionAfterClientPayment(input: {
    invoiceId: string;
    paymentId: string;
  }): Promise<void> {
    const dup = await this.prisma.partnerAccrual.findUnique({
      where: { paymentId: input.paymentId },
    });
    if (dup) return;

    const invoice = await this.loadPaidSubscriptionInvoice(input.invoiceId);
    if (!invoice) return;

    const order = await this.resolveEligiblePartnerOrder(invoice);
    if (!order) return;

    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId },
      select: { paymentDate: true, amount: true },
    });
    if (!payment) return;

    await this.createSubscriptionReferralAccrual({
      invoice,
      order,
      payment,
      paymentId: input.paymentId,
    });
  }

  /** Flip held subscription accruals to ELIGIBLE. Idempotent via updateMany. */
  async releaseHeldAccrualsAfterDelivery(orderId: string): Promise<void> {
    const where = heldSubscriptionAccrualWhere(orderId);
    const held = await this.prisma.partnerAccrual.aggregate({
      where,
      _sum: { amount: true },
    });
    const released = await this.prisma.partnerAccrual.updateMany({
      where,
      data: { status: 'ELIGIBLE', eligibleAt: new Date() },
    });
    if (released.count === 0) return;

    this.logger.log(
      {
        orderId,
        releasedCount: released.count,
        releasedAmount: new Decimal(held._sum.amount?.toString() ?? '0').toFixed(2),
      },
      'Released held subscription partner accruals after delivery',
    );
  }

  private async loadPaidSubscriptionInvoice(
    invoiceId: string,
  ): Promise<PaidSubscriptionInvoice | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        moneyStatus: true,
        type: true,
        projectId: true,
        orderId: true,
        subscriptionId: true,
        companyId: true,
        subscription: { select: { partnerId: true, type: true } },
      },
    });
    if (!invoice || invoice.moneyStatus !== 'PAID') return null;
    if (invoice.type !== 'SUBSCRIPTION' || !invoice.subscriptionId) return null;
    if (!invoice.projectId) return null;
    return { ...invoice, projectId: invoice.projectId, subscriptionId: invoice.subscriptionId };
  }

  private async resolveEligiblePartnerOrder(
    invoice: PaidSubscriptionInvoice,
  ): Promise<InboundSubscriptionOrder | null> {
    const order = await this.resolveOrderForSubscriptionPartnerInvoice({
      projectId: invoice.projectId,
      orderId: invoice.orderId,
      subscriptionPartnerId: invoice.subscription?.partnerId ?? null,
    });
    if (!order?.dealId || !order.deal) return null;
    if (order.paymentType !== 'SUBSCRIPTION') return null;
    if (order.deal.source !== 'PARTNER' || !order.deal.sourcePartnerId) return null;

    const terms = order.deal.partnerReferralTerms;
    if (!terms || terms.partnerId !== order.deal.sourcePartnerId) return null;
    if (terms.paymentType && terms.paymentType !== order.paymentType) return null;
    return order;
  }

  private resolveCreateStatus(
    subscriptionType: string | null | undefined,
    order: InboundSubscriptionOrder,
  ): { status: 'ACCRUED' | 'ELIGIBLE'; eligibleAt: Date | null } {
    if (isDevelopmentSubscriptionType(subscriptionType) && !hasInboundDeliveryCarrier(order)) {
      this.logger.warn(
        {
          orderId: order.id,
          reason: 'order has neither productId nor extensionId',
        },
        'Subscription partner accrual created ELIGIBLE: no delivery carrier to release against',
      );
      return { status: 'ELIGIBLE', eligibleAt: new Date() };
    }

    const hold = shouldHoldSubscriptionAccrualUntilDelivery({ subscriptionType, order });
    return hold
      ? { status: 'ACCRUED', eligibleAt: null }
      : { status: 'ELIGIBLE', eligibleAt: new Date() };
  }

  private async createSubscriptionReferralAccrual(input: {
    invoice: PaidSubscriptionInvoice;
    order: InboundSubscriptionOrder;
    payment: { paymentDate: Date; amount: Decimal };
    paymentId: string;
  }): Promise<void> {
    const terms = input.order.deal?.partnerReferralTerms;
    if (!terms) return;

    const baseAmount = new Decimal(input.payment.amount.toString());
    const percent = new Decimal(terms.partnerPercent.toString());
    const amount = computeInboundPartnerAccrualAmount(baseAmount, percent);
    const { status, eligibleAt } = this.resolveCreateStatus(
      input.invoice.subscription?.type,
      input.order,
    );

    const row = await this.prisma.partnerAccrual.create({
      data: {
        partnerId: terms.partnerId,
        referralTermsId: terms.id,
        projectId: input.order.projectId,
        productId: input.order.productId,
        orderId: input.order.id,
        subscriptionId: input.invoice.subscriptionId,
        invoiceId: input.invoice.id,
        paymentId: input.paymentId,
        dealType: terms.dealType,
        paymentType: input.order.paymentType,
        baseAmount,
        percent,
        amount,
        status,
        eligibleAt,
      },
    });

    await this.appendSubscriptionAccrualJournal({
      rowId: row.id,
      amount,
      bookedAt: input.payment.paymentDate,
      partnerId: terms.partnerId,
      companyId: input.invoice.companyId,
      projectId: input.order.projectId,
      productId: input.order.productId,
      orderId: input.order.id,
      invoiceId: input.invoice.id,
      subscriptionId: input.invoice.subscriptionId,
    });
  }

  private async appendSubscriptionAccrualJournal(input: {
    rowId: string;
    amount: Decimal;
    bookedAt: Date;
    partnerId: string;
    companyId: string | null;
    projectId: string;
    productId: string | null;
    orderId: string;
    invoiceId: string;
    subscriptionId: string;
  }): Promise<void> {
    try {
      await this.operationalJournal.appendPartnerAccrualLine({
        partnerAccrualId: input.rowId,
        amount: Number(input.amount.toFixed(2)),
        bookedAt: input.bookedAt,
        partnerId: input.partnerId,
        companyId: input.companyId,
        projectId: input.projectId,
        productId: input.productId,
        orderId: input.orderId,
        description: `Partner accrual (subscription referral) sub ${input.subscriptionId.slice(0, 8)}`,
      });
    } catch (err) {
      await this.prisma.partnerAccrual
        .delete({ where: { id: input.rowId } })
        .catch(() => undefined);
      this.logger.error(
        { err, partnerAccrualId: input.rowId },
        'Subscription partner accrual journal line failed; rolled back accrual row',
      );
      throw err;
    }

    this.logger.log(
      { invoiceId: input.invoiceId, partnerAccrualAmount: input.amount.toFixed(2) },
      'Created inbound subscription PartnerAccrual',
    );
  }

  private async resolveOrderForSubscriptionPartnerInvoice(input: {
    projectId: string;
    orderId: string | null;
    subscriptionPartnerId: string | null;
  }): Promise<InboundSubscriptionOrder | null> {
    if (input.orderId) {
      return this.prisma.order.findUnique({
        where: { id: input.orderId },
        select: inboundSubscriptionOrderSelect,
      });
    }

    const dealPartnerFilter = input.subscriptionPartnerId
      ? { sourcePartnerId: input.subscriptionPartnerId }
      : { sourcePartnerId: { not: null } };

    return this.prisma.order.findFirst({
      where: {
        projectId: input.projectId,
        paymentType: 'SUBSCRIPTION',
        deal: {
          source: 'PARTNER',
          ...dealPartnerFilter,
          partnerReferralTerms: { isNot: null },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: inboundSubscriptionOrderSelect,
    });
  }
}
