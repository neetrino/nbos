import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { loadCoverageInvoicesBySubscription } from './billing-coverage-invoices';
import { subscriptionBillingPausedForLateDelivery } from './billing-subscription-delivery-pause';
import { resolveTermCompletion } from './billing-subscription-term-completion';
import { matchingSubscriptionBillingDays } from './subscription-billing-days';
import { financeCalendarMonthKey } from '../subscriptions/subscription-coverage-month';
import { subscriptionChargeAmount } from '../subscriptions/subscription-billing-amount';
import {
  isBillingMonthCoveredByInvoices,
  type SubscriptionCoverageInvoiceRow,
} from '../subscriptions/subscription-coverage-window';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';

export interface BillingRunResult {
  generatedInvoices: number;
  totalAmount: number;
  errors: string[];
  /** Monthly dev subscription invoices not created because delivery missed `Product`/`Extension` deadline. */
  skippedLateDelivery: { subscriptionCode: string; projectCode: string }[];
  /** Fixed-term subscriptions finished because covered months already met `termMonths`. */
  completedTerm: { subscriptionCode: string; projectCode: string }[];
}

const subscriptionBillingInclude = {
  project: { select: { id: true, code: true, name: true, companyId: true } },
  product: {
    select: {
      deadline: true,
      status: true,
      deliveryResolution: true,
      extensions: {
        select: { deadline: true, status: true, deliveryResolution: true },
      },
    },
  },
  partner: { select: { id: true } },
} satisfies Prisma.SubscriptionInclude;

type BillableSubscription = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionBillingInclude;
}>;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /**
   * Generates invoices for all active subscriptions whose billingDay matches today
   * (including end-of-month clamp for short months). Skips subscriptions whose
   * existing invoices already cover the billing month.
   */
  async runMonthlyBilling(targetDate?: Date): Promise<BillingRunResult> {
    const now = targetDate ?? new Date();
    const day = now.getDate();
    const billingMonthKey = financeCalendarMonthKey(now);
    const subscriptions = await this.findSubscriptionsDueOn(now);
    this.logger.log(`Found ${subscriptions.length} subscriptions to bill for day ${day}`);

    const coverageBySubscriptionId = await loadCoverageInvoicesBySubscription(
      this.prisma,
      subscriptions.map((sub) => sub.id),
    );

    const result: BillingRunResult = {
      generatedInvoices: 0,
      totalAmount: 0,
      errors: [],
      skippedLateDelivery: [],
      completedTerm: [],
    };

    for (const sub of subscriptions) {
      await this.billOneSubscription(
        sub,
        now,
        day,
        billingMonthKey,
        coverageBySubscriptionId,
        result,
      );
    }

    return result;
  }

  private async findSubscriptionsDueOn(now: Date): Promise<BillableSubscription[]> {
    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        billingDay: { in: matchingSubscriptionBillingDays(now) },
        billingStartDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: subscriptionBillingInclude,
    });
  }

  private async billOneSubscription(
    sub: BillableSubscription,
    now: Date,
    day: number,
    billingMonthKey: string,
    coverageBySubscriptionId: Map<string, SubscriptionCoverageInvoiceRow[]>,
    result: BillingRunResult,
  ): Promise<void> {
    try {
      if (
        subscriptionBillingPausedForLateDelivery({
          subscriptionType: sub.type,
          products: [sub.product],
          billingDate: now,
        })
      ) {
        result.skippedLateDelivery.push({
          subscriptionCode: sub.code,
          projectCode: sub.project.code,
        });
        this.logger.log(
          `Skipping subscription ${sub.code}: development billing pause (delivery past deadline, undelivered)`,
        );
        return;
      }

      const existingInvoices = coverageBySubscriptionId.get(sub.id) ?? [];
      if (await this.completeSubscriptionIfTermMet(sub, existingInvoices, result)) {
        return;
      }

      if (isBillingMonthCoveredByInvoices(billingMonthKey, existingInvoices)) {
        this.logger.log(
          `Invoice coverage already includes ${billingMonthKey} for subscription ${sub.code}`,
        );
        return;
      }

      const amount = await this.createSubscriptionInvoice(sub, now, day, billingMonthKey);
      result.generatedInvoices++;
      result.totalAmount += amount;
    } catch (err) {
      const message = `Failed to generate invoice for subscription ${sub.code}: ${(err as Error).message}`;
      this.logger.error(message);
      result.errors.push(message);
    }
  }

  /**
   * Order: pause (above) → term completion → coverage dedup → create.
   * Pause first so a late-delivery month never creates an invoice (and thus never
   * consumes term). Term completion uses invoice coverage only, so a paused month
   * cannot mark the term complete by itself.
   */
  private async completeSubscriptionIfTermMet(
    sub: BillableSubscription,
    existingInvoices: readonly SubscriptionCoverageInvoiceRow[],
    result: BillingRunResult,
  ): Promise<boolean> {
    const decision = resolveTermCompletion({
      termMonths: sub.termMonths,
      endDate: sub.endDate,
      invoices: existingInvoices,
    });
    if (!decision.shouldComplete) {
      return false;
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'COMPLETED',
        ...(decision.endDate != null ? { endDate: decision.endDate } : {}),
      },
    });

    result.completedTerm.push({
      subscriptionCode: sub.code,
      projectCode: sub.project.code,
    });
    this.logger.log(
      `Completed subscription ${sub.code}: covered ${decision.coveredMonths} months meets termMonths ${sub.termMonths}`,
    );
    return true;
  }

  private async createSubscriptionInvoice(
    sub: BillableSubscription,
    now: Date,
    day: number,
    coverageStartMonth: string,
  ): Promise<number> {
    const code = await allocateInvoiceCode(this.prisma, now.getFullYear());
    const dueDate = new Date(now.getFullYear(), now.getMonth(), day + 14);
    const charge = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);

    await this.prisma.invoice.create({
      data: {
        code,
        subscriptionId: sub.id,
        projectId: sub.projectId,
        companyId: sub.project.companyId,
        amount: charge.amount,
        taxStatus: sub.taxStatus,
        type: 'SUBSCRIPTION' as Prisma.InvoiceCreateInput['type'],
        dueDate,
        moneyStatus: 'NEW',
        coverageStartMonth,
        coverageMonthCount: charge.coverageMonthCount,
      },
    });

    this.logger.log(`Generated invoice ${code} for subscription ${sub.code}`);
    return charge.amount;
  }
}
