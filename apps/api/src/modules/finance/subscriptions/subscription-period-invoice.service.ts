import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaClient, type Prisma, type SubscriptionStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  persistSubscriptionBillingInvoice,
  type PersistedSubscriptionBillingInvoice,
} from '../billing/persist-subscription-billing-invoice';
import { subscriptionBillingPausedForLateDelivery } from '../billing/billing-subscription-delivery-pause';
import { buildSubscriptionBillingTarget } from '../billing/subscription-billing-window';
import { loadCoverageInvoicesBySubscription } from '../billing/billing-coverage-invoices';
import type { OfficialAwaitingNotifier } from '../invoices/invoice-card-persist';
import { InvoiceOfficialWhatsAppService } from '../invoices/invoice-official-whatsapp.service';
import { InvoicesService } from '../invoices/invoices.service';
import { lockSubscriptionRow } from './lock-subscription-row';
import { subscriptionChargeAmount } from './subscription-billing-amount';
import type { SubscriptionCoverageInvoiceRow } from './subscription-coverage-window';
import {
  assertCoverageMonthFreeForCharge,
  assertCoverageMonthInManualWindow,
  assertSelectedCoverageWindowsCompatible,
  parseCoverageMonthKeys,
  SUBSCRIPTION_PERIOD_INVOICE_ERROR,
  type CreatePeriodInvoiceBody,
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
   * Issues one billing card per uncovered coverage-start month.
   * Same persist path as the daily billing cron (amount, tax, due date, money status).
   */
  async create(subscriptionId: string, body: CreatePeriodInvoiceBody, now: Date = new Date()) {
    const coverageMonthKeys = parseCoverageMonthKeys(body);
    const created = await this.prisma.$transaction((tx) =>
      this.issueLockedBatch(tx, subscriptionId, coverageMonthKeys, now),
    );
    return Promise.all(created.map((row) => this.invoicesService.findById(row.id)));
  }

  private async issueLockedBatch(
    tx: PeriodInvoiceDb,
    subscriptionId: string,
    coverageMonthKeys: string[],
    now: Date,
  ) {
    await lockSubscriptionRow(tx, subscriptionId);
    const sub = await this.loadActiveSubscription(tx, subscriptionId);
    this.assertIssuable(sub, coverageMonthKeys, now);
    const charge = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);
    assertSelectedCoverageWindowsCompatible(coverageMonthKeys, charge.coverageMonthCount);
    const existing = await this.loadCoverageRows(tx, sub.id);
    return persistSelectedPeriods({
      tx,
      officialWhatsApp: this.officialWhatsApp,
      sub,
      coverageMonthKeys,
      charge,
      existing,
      now,
    });
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
    coverageMonthKeys: readonly string[],
    now: Date,
  ): void {
    if (
      subscriptionBillingPausedForLateDelivery({
        subscriptionType: sub.type,
        products: [sub.product],
        billingDate: now,
      })
    ) {
      throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.DELIVERY_PAUSE);
    }
    for (const coverageMonthKey of coverageMonthKeys) {
      assertCoverageMonthInManualWindow({
        coverageMonthKey,
        now,
        billingStartDate: sub.billingStartDate,
        endDate: sub.endDate,
      });
    }
  }
}

async function persistSelectedPeriods(args: {
  tx: PeriodInvoiceDb;
  officialWhatsApp: OfficialAwaitingNotifier | undefined;
  sub: PeriodInvoiceSubscription;
  coverageMonthKeys: readonly string[];
  charge: { amount: number; coverageMonthCount: number };
  existing: SubscriptionCoverageInvoiceRow[];
  now: Date;
}) {
  const created: PersistedSubscriptionBillingInvoice[] = [];
  let invoices = args.existing;
  for (const coverageMonthKey of args.coverageMonthKeys) {
    const persisted = await persistOnePeriod({
      tx: args.tx,
      officialWhatsApp: args.officialWhatsApp,
      sub: args.sub,
      coverageMonthKey,
      coverageMonthCount: args.charge.coverageMonthCount,
      invoices,
      now: args.now,
    });
    created.push(persisted);
    invoices = [
      ...invoices,
      {
        type: 'SUBSCRIPTION',
        coverageStartMonth: coverageMonthKey,
        coverageMonthCount: args.charge.coverageMonthCount,
        createdAt: args.now,
      },
    ];
  }
  return created;
}

async function persistOnePeriod(args: {
  tx: PeriodInvoiceDb;
  officialWhatsApp: OfficialAwaitingNotifier | undefined;
  sub: PeriodInvoiceSubscription;
  coverageMonthKey: string;
  coverageMonthCount: number;
  invoices: readonly SubscriptionCoverageInvoiceRow[];
  now: Date;
}) {
  assertCoverageMonthFreeForCharge({
    coverageMonthKey: args.coverageMonthKey,
    coverageMonthCount: args.coverageMonthCount,
    invoices: args.invoices,
    termMonths: args.sub.termMonths,
  });
  const year = Number(args.coverageMonthKey.slice(0, 4));
  const month = Number(args.coverageMonthKey.slice(5, 7));
  return persistSubscriptionBillingInvoice(
    args.tx,
    args.officialWhatsApp,
    args.sub,
    args.now,
    buildSubscriptionBillingTarget(year, month, args.sub.billingDay),
  );
}
