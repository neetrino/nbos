import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaClient, type Prisma, type SubscriptionStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { persistSubscriptionBillingInvoice } from '../billing/persist-subscription-billing-invoice';
import { subscriptionBillingPausedForLateDelivery } from '../billing/billing-subscription-delivery-pause';
import { buildSubscriptionBillingTarget } from '../billing/subscription-billing-window';
import { loadCoverageInvoicesBySubscription } from '../billing/billing-coverage-invoices';
import { InvoiceOfficialWhatsAppService } from '../invoices/invoice-official-whatsapp.service';
import { InvoicesService } from '../invoices/invoices.service';
import { lockSubscriptionRow } from './lock-subscription-row';
import { subscriptionChargeAmount } from './subscription-billing-amount';
import {
  assertCoverageMonthFreeForCharge,
  assertCoverageMonthInManualWindow,
  parseCoverageMonthKey,
  SUBSCRIPTION_PERIOD_INVOICE_ERROR,
} from './subscription-period-invoice-month';

const ACTIVE_STATUS: SubscriptionStatusEnum = 'ACTIVE';

const periodInvoiceInclude = {
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      companyId: true,
      company: { select: { name: true, legalName: true, taxId: true } },
    },
  },
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
} satisfies Prisma.SubscriptionInclude;

type PeriodInvoiceSubscription = Prisma.SubscriptionGetPayload<{
  include: typeof periodInvoiceInclude;
}>;

type PeriodInvoiceDb = Pick<
  InstanceType<typeof PrismaClient>,
  'subscription' | 'invoice' | '$queryRaw'
>;

@Injectable()
export class SubscriptionPeriodInvoiceService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly invoicesService: InvoicesService,
    @Optional() private readonly officialWhatsApp?: InvoiceOfficialWhatsAppService,
  ) {}

  /**
   * Issues one subscription billing card for an uncovered coverage month.
   * Same persist path as the daily billing cron (amount, tax, due date, money status).
   */
  async create(subscriptionId: string, body: { coverageMonth?: string }, now: Date = new Date()) {
    const coverageMonthKey = parseCoverageMonthKey(body.coverageMonth);
    const created = await this.prisma.$transaction((tx) =>
      this.issueLocked(tx, subscriptionId, coverageMonthKey, now),
    );
    return this.invoicesService.findById(created.id);
  }

  private async issueLocked(
    tx: PeriodInvoiceDb,
    subscriptionId: string,
    coverageMonthKey: string,
    now: Date,
  ) {
    await lockSubscriptionRow(tx, subscriptionId);
    const sub = await this.loadActiveSubscription(tx, subscriptionId);
    this.assertIssuable(sub, coverageMonthKey, now);
    const existing = await this.loadCoverageRows(tx, sub.id);
    const charge = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);
    assertCoverageMonthFreeForCharge({
      coverageMonthKey,
      coverageMonthCount: charge.coverageMonthCount,
      invoices: existing,
      termMonths: sub.termMonths,
    });
    const year = Number(coverageMonthKey.slice(0, 4));
    const month = Number(coverageMonthKey.slice(5, 7));
    return persistSubscriptionBillingInvoice(
      tx,
      this.officialWhatsApp,
      sub,
      now,
      buildSubscriptionBillingTarget(year, month, sub.billingDay),
    );
  }

  private async loadActiveSubscription(
    db: PeriodInvoiceDb,
    id: string,
  ): Promise<PeriodInvoiceSubscription> {
    const sub = await db.subscription.findUnique({
      where: { id },
      include: periodInvoiceInclude,
    });
    if (!sub) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    if (sub.status !== ACTIVE_STATUS) {
      throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.NOT_ACTIVE);
    }
    return sub;
  }

  private async loadCoverageRows(db: PeriodInvoiceDb, subscriptionId: string) {
    const byId = await loadCoverageInvoicesBySubscription(db, [subscriptionId]);
    return byId.get(subscriptionId) ?? [];
  }

  private assertIssuable(
    sub: PeriodInvoiceSubscription,
    coverageMonthKey: string,
    now: Date,
  ): void {
    assertCoverageMonthInManualWindow({
      coverageMonthKey,
      now,
      billingStartDate: sub.billingStartDate,
      endDate: sub.endDate,
    });
    if (
      subscriptionBillingPausedForLateDelivery({
        subscriptionType: sub.type,
        products: [sub.product],
        billingDate: now,
      })
    ) {
      throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.DELIVERY_PAUSE);
    }
  }
}
