import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { OperationalJournalService } from '../journal/operational-journal.service';
import {
  computeInboundPartnerAccrualAmount,
  isClassicInboundDeliveryComplete,
} from './partner-accrual-classic.ops';

/**
 * PAR-01 classic inbound referral: project/product (or extension) delivered AND order fully paid.
 */
@Injectable()
export class PartnerAccrualClassicService {
  private readonly logger = new Logger(PartnerAccrualClassicService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly operationalJournal: OperationalJournalService,
  ) {}

  /** Call after a client payment when the order may have become fully paid. */
  async tryInboundClassicAfterClientPayment(input: {
    orderId: string;
    paymentId: string;
    invoiceId: string;
  }): Promise<void> {
    await this.tryCreateInboundClassicAccrual(input);
  }

  /** Call when product/extension reaches DONE — order may already be fully paid. */
  async tryInboundClassicAfterDelivery(orderId: string): Promise<void> {
    const latest = await this.prisma.payment.findFirst({
      where: { invoice: { orderId } },
      orderBy: { paymentDate: 'desc' },
      select: { id: true, invoiceId: true },
    });
    if (!latest) return;
    await this.tryCreateInboundClassicAccrual({
      orderId,
      paymentId: latest.id,
      invoiceId: latest.invoiceId,
    });
  }

  private async tryCreateInboundClassicAccrual(input: {
    orderId: string;
    paymentId: string;
    invoiceId: string;
  }): Promise<void> {
    const dupPayment = await this.prisma.partnerAccrual.findUnique({
      where: { paymentId: input.paymentId },
    });
    if (dupPayment) return;

    const dupOrderClassic = await this.prisma.partnerAccrual.findFirst({
      where: { orderId: input.orderId, subscriptionId: null },
    });
    if (dupOrderClassic) return;

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        projectId: true,
        dealId: true,
        productId: true,
        extensionId: true,
        paymentType: true,
        totalAmount: true,
        product: { select: { status: true } },
        extension: { select: { status: true } },
        deal: {
          select: {
            source: true,
            sourcePartnerId: true,
            partnerReferralTerms: {
              select: {
                id: true,
                partnerId: true,
                partnerPercent: true,
                dealType: true,
                paymentType: true,
              },
            },
          },
        },
      },
    });

    if (!order?.dealId || !order.deal) return;
    if (order.status !== 'FULLY_PAID') return;
    if (order.paymentType !== 'CLASSIC') return;
    if (order.deal.source !== 'PARTNER' || !order.deal.sourcePartnerId) return;

    const terms = order.deal.partnerReferralTerms;
    if (!terms || terms.partnerId !== order.deal.sourcePartnerId) return;

    if (terms.paymentType && terms.paymentType !== order.paymentType) return;

    if (!isClassicInboundDeliveryComplete(order)) {
      this.logger.debug(
        { orderId: order.id },
        'Skipping partner accrual: classic inbound delivery not DONE yet',
      );
      return;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { companyId: true },
    });

    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId },
      select: { paymentDate: true },
    });
    if (!payment) return;

    const baseAmount = new Decimal(order.totalAmount.toString());
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
        invoiceId: input.invoiceId,
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
        companyId: invoice?.companyId ?? null,
        projectId: order.projectId,
        productId: order.productId,
        orderId: order.id,
        description: `Partner accrual (classic referral) order ${order.id.slice(0, 8)}`,
      });
    } catch (err) {
      await this.prisma.partnerAccrual.delete({ where: { id: row.id } }).catch(() => undefined);
      this.logger.error(
        { err, partnerAccrualId: row.id },
        'Partner accrual journal line failed; rolled back accrual row',
      );
      throw err;
    }

    this.logger.log(
      { orderId: order.id, partnerAccrualAmount: amount.toFixed(2) },
      'Created inbound classic PartnerAccrual',
    );
  }
}
