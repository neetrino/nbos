import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { subscriptionBillingPausedForLateDelivery } from './billing-subscription-delivery-pause';
import { matchingSubscriptionBillingDays } from './subscription-billing-days';
import { financeCalendarMonthKey } from '../subscriptions/subscription-coverage-month';
import { subscriptionChargeAmount } from '../subscriptions/subscription-billing-amount';
import {
  isBillingMonthCoveredByInvoices,
  type SubscriptionCoverageInvoiceRow,
} from '../subscriptions/subscription-coverage-window';

export interface BillingRunResult {
  generatedInvoices: number;
  totalAmount: number;
  errors: string[];
  /** Monthly dev subscription invoices not created because delivery missed `Product`/`Extension` deadline. */
  skippedLateDelivery: { subscriptionCode: string; projectCode: string }[];
}

const subscriptionBillingInclude = {
  project: { select: { id: true, code: true, name: true } },
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

    const coverageBySubscriptionId = await this.loadCoverageInvoicesBySubscription(
      subscriptions.map((sub) => sub.id),
    );

    const result: BillingRunResult = {
      generatedInvoices: 0,
      totalAmount: 0,
      errors: [],
      skippedLateDelivery: [],
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

  /**
   * Generates planned expenses (rent, salaries, etc.) for the 1st of each month.
   */
  async runMonthlyExpenses(targetDate?: Date): Promise<{ generated: number }> {
    const now = targetDate ?? new Date();

    if (now.getDate() !== 1) {
      return { generated: 0 };
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const existingCount = await this.prisma.expense.count({
      where: {
        type: 'PLANNED',
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    if (existingCount > 0) {
      this.logger.log('Planned expenses already generated for this month');
      return { generated: 0 };
    }

    const templates = await this.prisma.expense.findMany({
      where: { type: 'PLANNED' },
      orderBy: { createdAt: 'desc' },
      distinct: ['category'],
    });

    let generated = 0;
    for (const tpl of templates) {
      await this.prisma.expense.create({
        data: {
          projectId: tpl.projectId,
          category: tpl.category,
          name: tpl.name,
          type: 'PLANNED',
          amount: tpl.amount,
          notes: tpl.notes,
        },
      });
      generated++;
    }

    this.logger.log(`Generated ${generated} planned expenses for the month`);
    return { generated };
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

  private async createSubscriptionInvoice(
    sub: BillableSubscription,
    now: Date,
    day: number,
    coverageStartMonth: string,
  ): Promise<number> {
    const code = await this.generateInvoiceCode(now);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), day + 14);
    const charge = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);

    await this.prisma.invoice.create({
      data: {
        code,
        subscriptionId: sub.id,
        projectId: sub.projectId,
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

  private async loadCoverageInvoicesBySubscription(
    subscriptionIds: string[],
  ): Promise<Map<string, SubscriptionCoverageInvoiceRow[]>> {
    const bySubscriptionId = new Map<string, SubscriptionCoverageInvoiceRow[]>();
    if (subscriptionIds.length === 0) {
      return bySubscriptionId;
    }

    const rows = await this.prisma.invoice.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
        type: 'SUBSCRIPTION',
      },
      select: {
        subscriptionId: true,
        coverageStartMonth: true,
        coverageMonthCount: true,
        createdAt: true,
      },
    });

    for (const row of rows) {
      if (!row.subscriptionId) {
        continue;
      }
      const list = bySubscriptionId.get(row.subscriptionId) ?? [];
      list.push({
        coverageStartMonth: row.coverageStartMonth,
        coverageMonthCount: row.coverageMonthCount,
        createdAt: row.createdAt,
      });
      bySubscriptionId.set(row.subscriptionId, list);
    }
    return bySubscriptionId;
  }

  private async generateInvoiceCode(targetDate: Date): Promise<string> {
    const year = targetDate.getFullYear();
    const prefix = `INV-${year}-`;
    const last = await this.prisma.invoice.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
