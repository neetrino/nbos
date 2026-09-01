import type { PrismaClient, TaxStatus } from '@nbos/database';
import { allocateInvoiceCode } from '../../../common/utils/entity-code-series';
import {
  persistInvoiceCreate,
  type OfficialAwaitingNotifier,
} from '../invoices/invoice-card-persist';
import { resolveSubscriptionInvoiceDueDate } from '../invoices/subscription-invoice-due-date';
import { subscriptionChargeAmount } from '../subscriptions/subscription-billing-amount';
import { resolveBillingInvoiceMoneyStatus } from './billing-subscription-invoice-status';
import type { SubscriptionBillingTarget } from './subscription-billing-window';

export interface SubscriptionBillingInvoiceSource {
  id: string;
  code: string;
  projectId: string;
  amount: unknown;
  coverageMonthCount: number;
  taxStatus: TaxStatus;
  billingDay: number;
  project: {
    companyId: string | null;
    company: { name: string; legalName: string | null; taxId: string | null } | null;
  };
}

export interface PersistedSubscriptionBillingInvoice {
  id: string;
  code: string;
  amount: number;
}

export type SubscriptionBillingPersistDb = Pick<
  InstanceType<typeof PrismaClient>,
  'invoice' | '$queryRaw'
>;

/** Writes one subscription billing card (cron and manual issue share this path). */
export async function persistSubscriptionBillingInvoice(
  prisma: SubscriptionBillingPersistDb,
  officialWhatsApp: OfficialAwaitingNotifier | undefined,
  sub: SubscriptionBillingInvoiceSource,
  now: Date,
  target: SubscriptionBillingTarget,
): Promise<PersistedSubscriptionBillingInvoice> {
  const coverageYear = Number(target.coverageMonthKey.slice(0, 4));
  const code = await allocateInvoiceCode(prisma, coverageYear);
  const dueDate = resolveSubscriptionInvoiceDueDate({
    expectedPayDate: target.expectedPayDate,
    issuedOn: now,
  });
  const charge = subscriptionChargeAmount(Number(sub.amount), sub.coverageMonthCount);
  const moneyStatus = resolveBillingInvoiceMoneyStatus({
    billingDay: sub.billingDay,
    taxStatus: sub.taxStatus,
    company: sub.project.company,
  });

  const invoice = await persistInvoiceCreate(
    prisma,
    {
      code,
      subscriptionId: sub.id,
      projectId: sub.projectId,
      companyId: sub.project.companyId,
      amount: charge.amount,
      taxStatus: sub.taxStatus,
      type: 'SUBSCRIPTION',
      dueDate,
      moneyStatus,
      coverageStartMonth: target.coverageMonthKey,
      coverageMonthCount: charge.coverageMonthCount,
    },
    officialWhatsApp,
  );

  return { id: invoice.id, code, amount: charge.amount };
}
