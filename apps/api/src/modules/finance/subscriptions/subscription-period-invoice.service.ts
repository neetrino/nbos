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
import { notifyOfficialAfterInvoiceWrite } from '../invoices/invoice-card-persist';
import { InvoiceOfficialWhatsAppService } from '../invoices/invoice-official-whatsapp.service';
import { InvoicesService } from '../invoices/invoices.service';
import { lockSubscriptionRow } from './lock-subscription-row';
import { subscriptionChargeAmount, subscriptionPrepaidCharge } from './subscription-billing-amount';
import type { SubscriptionCoverageInvoiceRow } from './subscription-coverage-window';
import {
  assertCoverageMonthFreeForCharge,
  assertCoverageMonthInManualWindow,
  assertSelectedCoverageStartsConsecutive,
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
   * Issues one billing card for the selected consecutive period starts.
   * Amount and coverage are the period charge × selected count (prepaid).
   */
  async create(subscriptionId: string, body: CreatePeriodInvoiceBody, now: Date = new Date()) {
    const coverageMonthKeys = parseCoverageMonthKeys(body);
    const created = await this.prisma.$transaction((tx) =>
      this.issueLockedInvoice(tx, subscriptionId, coverageMonthKeys, now),
    );
    // Official WhatsApp reads via the root Prisma client — notify only after commit.
    await notifyOfficialAfterInvoiceWrite(this.officialWhatsApp, created);
    return [await this.invoicesService.findById(created.id)];
  }

  private async issueLockedInvoice(
    tx: PeriodInvoiceDb,
    subscriptionId: string,
    coverageMonthKeys: string[],
    now: Date,
  ) {
    await lockSubscriptionRow(tx, subscriptionId);
    const sub = await this.loadActiveSubscription(tx, subscriptionId);
    this.assertIssuable(sub, coverageMonthKeys, now);
    const period = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);
    assertSelectedCoverageStartsConsecutive(coverageMonthKeys, period.coverageMonthCount);
    assertSelectedCoverageWindowsCompatible(coverageMonthKeys, period.coverageMonthCount);
    const charge = subscriptionPrepaidCharge(
      Number(sub.amount),
      sub.coverageMonthCount,
      coverageMonthKeys.length,
    );
    const existing = await this.loadCoverageRows(tx, sub.id);
    return persistPrepaidInvoice({
      tx,
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

async function persistPrepaidInvoice(args: {
  tx: PeriodInvoiceDb;
  sub: PeriodInvoiceSubscription;
  coverageMonthKeys: readonly string[];
  charge: { amount: number; coverageMonthCount: number };
  existing: SubscriptionCoverageInvoiceRow[];
  now: Date;
}) {
  const coverageMonthKey = args.coverageMonthKeys[0];
  if (!coverageMonthKey) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.EMPTY_MONTHS);
  }
  assertCoverageMonthFreeForCharge({
    coverageMonthKey,
    coverageMonthCount: args.charge.coverageMonthCount,
    invoices: args.existing,
    termMonths: args.sub.termMonths,
  });
  const year = Number(coverageMonthKey.slice(0, 4));
  const month = Number(coverageMonthKey.slice(5, 7));
  return persistSubscriptionBillingInvoice(
    args.tx,
    undefined,
    args.sub,
    args.now,
    buildSubscriptionBillingTarget(year, month, args.sub.billingDay),
    args.charge,
  );
}
