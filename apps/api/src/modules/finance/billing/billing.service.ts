import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { loadCoverageInvoicesBySubscription } from './billing-coverage-invoices';
import { subscriptionBillingPausedForLateDelivery } from './billing-subscription-delivery-pause';
import { resolveTermCompletion } from './billing-subscription-term-completion';
import {
  isSubscriptionOpenForTarget,
  resolveSubscriptionBillingTarget,
  yerevanBillingQueryBounds,
  type SubscriptionBillingTarget,
} from './subscription-billing-window';
import { subscriptionChargeAmount } from '../subscriptions/subscription-billing-amount';
import {
  isBillingMonthCoveredByInvoices,
  type SubscriptionCoverageInvoiceRow,
} from '../subscriptions/subscription-coverage-window';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';
import { resolveSubscriptionInvoiceDueDate } from '../invoices/subscription-invoice-due-date';

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

interface DueSubscription {
  sub: BillableSubscription;
  target: SubscriptionBillingTarget;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /**
   * Daily run: day-1 cards from the penultimate weekday (next month) with catch-up;
   * days 2–31 from the 1st of the coverage month. Skips months already covered.
   */
  async runMonthlyBilling(targetDate?: Date): Promise<BillingRunResult> {
    const now = targetDate ?? new Date();
    const due = await this.findSubscriptionsDueOn(now);
    this.logger.log(`Found ${due.length} subscriptions to bill`);

    const coverageBySubscriptionId = await loadCoverageInvoicesBySubscription(
      this.prisma,
      due.map((row) => row.sub.id),
    );

    const result = emptyBillingResult();
    for (const row of due) {
      await this.billOneSubscription(row, now, coverageBySubscriptionId, result);
    }
    return result;
  }

  private async findSubscriptionsDueOn(now: Date): Promise<DueSubscription[]> {
    const bounds = yerevanBillingQueryBounds(now);
    const rows = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        billingStartDate: { lte: bounds.lte },
        OR: [{ endDate: null }, { endDate: { gte: bounds.gte } }],
      },
      include: subscriptionBillingInclude,
    });
    return rows.flatMap((sub) => {
      const target = resolveSubscriptionBillingTarget(now, sub.billingDay);
      if (!target) return [];
      if (
        !isSubscriptionOpenForTarget({
          billingStartDate: sub.billingStartDate,
          endDate: sub.endDate,
          expectedPayKey: target.expectedPayKey,
        })
      ) {
        return [];
      }
      return [{ sub, target }];
    });
  }

  private async billOneSubscription(
    row: DueSubscription,
    now: Date,
    coverageBySubscriptionId: Map<string, SubscriptionCoverageInvoiceRow[]>,
    result: BillingRunResult,
  ): Promise<void> {
    const { sub, target } = row;
    try {
      if (this.isPausedForLateDelivery(sub, now, result)) return;
      const existingInvoices = coverageBySubscriptionId.get(sub.id) ?? [];
      if (await this.completeSubscriptionIfTermMet(sub, existingInvoices, result)) return;
      if (isBillingMonthCoveredByInvoices(target.coverageMonthKey, existingInvoices)) {
        this.logger.log(
          `Invoice coverage already includes ${target.coverageMonthKey} for subscription ${sub.code}`,
        );
        return;
      }
      const amount = await this.createSubscriptionInvoice(sub, now, target);
      result.generatedInvoices += 1;
      result.totalAmount += amount;
    } catch (err) {
      const message = `Failed to generate invoice for subscription ${sub.code}: ${(err as Error).message}`;
      this.logger.error(message);
      result.errors.push(message);
    }
  }

  private isPausedForLateDelivery(
    sub: BillableSubscription,
    now: Date,
    result: BillingRunResult,
  ): boolean {
    if (
      !subscriptionBillingPausedForLateDelivery({
        subscriptionType: sub.type,
        products: [sub.product],
        billingDate: now,
      })
    ) {
      return false;
    }
    result.skippedLateDelivery.push({
      subscriptionCode: sub.code,
      projectCode: sub.project.code,
    });
    this.logger.log(
      `Skipping subscription ${sub.code}: development billing pause (delivery past deadline, undelivered)`,
    );
    return true;
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
    target: SubscriptionBillingTarget,
  ): Promise<number> {
    const coverageYear = Number(target.coverageMonthKey.slice(0, 4));
    const code = await allocateInvoiceCode(this.prisma, coverageYear);
    const dueDate = resolveSubscriptionInvoiceDueDate({
      expectedPayDate: target.expectedPayDate,
      issuedOn: now,
    });
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
        coverageStartMonth: target.coverageMonthKey,
        coverageMonthCount: charge.coverageMonthCount,
      },
    });

    this.logger.log(`Generated invoice ${code} for subscription ${sub.code}`);
    return charge.amount;
  }
}

function emptyBillingResult(): BillingRunResult {
  return {
    generatedInvoices: 0,
    totalAmount: 0,
    errors: [],
    skippedLateDelivery: [],
    completedTerm: [],
  };
}
