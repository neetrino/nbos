import { Injectable, Inject, Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

const SALES_BONUS_TYPE = 'SALES' as const;
const BONUS_STATUS_INCOMING = 'INCOMING' as const;

type PaymentModelKey = 'CLASSIC' | 'SUBSCRIPTION_FIRST_MONTH';

@Injectable()
export class SalesBonusAccrualService {
  private readonly logger = new Logger(SalesBonusAccrualService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Called when an invoice is fully PAID. Creates at most one Seller and one Assistant
   * SALES bonus row per order (idempotent by `salesBonusSlot`).
   */
  async onInvoicePaid(invoiceId: string): Promise<void> {
    try {
      await this.runAccrual(invoiceId);
    } catch (err) {
      this.logger.error(
        { err, invoiceId, message: err instanceof Error ? err.message : String(err) },
        'Sales bonus accrual failed',
      );
    }
  }

  private async runAccrual(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        amount: true,
        orderId: true,
        order: {
          select: {
            id: true,
            projectId: true,
            totalAmount: true,
            paymentType: true,
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

    if (!invoice || invoice.status !== 'PAID' || !invoice.orderId || !invoice.order) {
      return;
    }

    const order = invoice.order;
    if (!order.dealId || !order.deal) {
      return;
    }

    const deal = order.deal;
    if (!deal.source) {
      this.logger.warn(
        { dealId: deal.id, orderId: order.id },
        'Skipping sales bonus: Deal has no From (source)',
      );
      return;
    }

    const paymentModel: PaymentModelKey =
      order.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION_FIRST_MONTH' : 'CLASSIC';

    const policy = await this.prisma.salesBonusPolicy.findFirst({
      where: {
        fromCategory: deal.source,
        paymentModel,
        isActive: true,
        effectiveFrom: { lte: new Date() },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!policy) {
      this.logger.warn(
        { from: deal.source, paymentModel, dealId: deal.id },
        'No active sales bonus policy row',
      );
      return;
    }

    const existingSlots = await this.prisma.bonusEntry.findMany({
      where: { orderId: order.id, salesBonusSlot: { not: null } },
      select: { salesBonusSlot: true },
    });
    const taken = new Set(existingSlots.map((row) => row.salesBonusSlot).filter(Boolean));
    if (taken.has('SELLER')) {
      return;
    }

    const baseAmount =
      paymentModel === 'CLASSIC' ? new Decimal(order.totalAmount) : new Decimal(invoice.amount);

    const snapshot = {
      fromCategory: deal.source,
      paymentModel,
      sellerPercent: Number(policy.sellerPercent),
      assistantPercent: Number(policy.assistantPercent),
      baseAmount: baseAmount.toString(),
      invoiceId: invoice.id,
      orderId: order.id,
      dealId: deal.id,
      basis: paymentModel === 'CLASSIC' ? 'ORDER_TOTAL' : 'FIRST_PAID_INVOICE_AMOUNT',
    };

    const sellerAmount = baseAmount.mul(policy.sellerPercent).div(new Decimal(100));
    const assistantAmount = baseAmount.mul(policy.assistantPercent).div(new Decimal(100));

    const rows: Array<{
      employeeId: string;
      slot: 'SELLER' | 'ASSISTANT';
      amount: Decimal;
      percent: Decimal;
    }> = [];

    if (sellerAmount.gt(0)) {
      rows.push({
        employeeId: deal.sellerId,
        slot: 'SELLER',
        amount: sellerAmount,
        percent: policy.sellerPercent,
      });
    }

    if (assistantAmount.gt(0) && deal.sellerAssistantId) {
      rows.push({
        employeeId: deal.sellerAssistantId,
        slot: 'ASSISTANT',
        amount: assistantAmount,
        percent: policy.assistantPercent,
      });
    }

    if (rows.length === 0) {
      return;
    }

    const snapshotJson = snapshot as InputJsonValue;

    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.bonusEntry.create({
          data: {
            employeeId: row.employeeId,
            orderId: order.id,
            projectId: order.projectId,
            dealId: deal.id,
            type: SALES_BONUS_TYPE,
            amount: row.amount,
            percent: row.percent,
            status: BONUS_STATUS_INCOMING,
            salesBonusSlot: row.slot,
            calculationSnapshot: snapshotJson,
          },
        }),
      ),
    );

    await syncProductBonusPoolForOrder(this.prisma, order.id);
  }
}
