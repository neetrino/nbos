import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { OperationalJournalService } from '../journal/operational-journal.service';
import { computeInboundPartnerAccrualAmount } from './partner-accrual-classic.ops';

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
  paymentType: true,
  deal: {
    select: {
      source: true,
      sourcePartnerId: true,
      partnerReferralTerms: { select: referralTermsSelect },
    },
  },
} satisfies Prisma.OrderSelect;

type InboundSubscriptionOrder = Prisma.OrderGetPayload<{
  select: typeof inboundSubscriptionOrderSelect;
}>;

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

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      select: {
        id: true,
        moneyStatus: true,
        type: true,
        projectId: true,
        orderId: true,
        subscriptionId: true,
        companyId: true,
        subscription: { select: { partnerId: true } },
      },
    });
    if (!invoice || invoice.moneyStatus !== 'PAID') return;
    if (invoice.type !== 'SUBSCRIPTION' || !invoice.subscriptionId) return;
    if (!invoice.projectId) return;

    const order = await this.resolveOrderForSubscriptionPartnerInvoice({
      projectId: invoice.projectId,
      orderId: invoice.orderId,
      subscriptionPartnerId: invoice.subscription?.partnerId ?? null,
    });
    if (!order?.dealId || !order.deal) return;
    if (order.paymentType !== 'SUBSCRIPTION') return;
    if (order.deal.source !== 'PARTNER' || !order.deal.sourcePartnerId) return;

    const terms = order.deal.partnerReferralTerms;
    if (!terms || terms.partnerId !== order.deal.sourcePartnerId) return;
    if (terms.paymentType && terms.paymentType !== order.paymentType) return;

    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId },
      select: { paymentDate: true, amount: true },
    });
    if (!payment) return;

    const baseAmount = new Decimal(payment.amount.toString());
    const percent = new Decimal(terms.partnerPercent.toString());
    const amount = computeInboundPartnerAccrualAmount(baseAmount, percent);
    const eligibleAt = new Date();

    const row = await this.prisma.partnerAccrual.create({
      data: {
        partnerId: terms.partnerId,
        referralTermsId: terms.id,
        projectId: order.projectId,
        productId: order.productId,
        orderId: order.id,
        subscriptionId: invoice.subscriptionId,
        invoiceId: invoice.id,
        paymentId: input.paymentId,
        dealType: terms.dealType,
        paymentType: order.paymentType,
        baseAmount,
        percent,
        amount,
        status: 'ELIGIBLE',
        eligibleAt,
      },
    });

    try {
      await this.operationalJournal.appendPartnerAccrualLine({
        partnerAccrualId: row.id,
        amount: Number(amount.toFixed(2)),
        bookedAt: payment.paymentDate,
        partnerId: terms.partnerId,
        companyId: invoice.companyId ?? null,
        projectId: order.projectId,
        productId: order.productId,
        orderId: order.id,
        description: `Partner accrual (subscription referral) sub ${invoice.subscriptionId.slice(0, 8)}`,
      });
    } catch (err) {
      await this.prisma.partnerAccrual.delete({ where: { id: row.id } }).catch(() => undefined);
      this.logger.error(
        { err, partnerAccrualId: row.id },
        'Subscription partner accrual journal line failed; rolled back accrual row',
      );
      throw err;
    }

    this.logger.log(
      { invoiceId: invoice.id, partnerAccrualAmount: amount.toFixed(2) },
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
