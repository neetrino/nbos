import { afterAll, describe, expect, it } from 'vitest';

import {
  createPrismaClient,
  Decimal,
  type LeadSourceEnum,
  type PrismaClient,
} from '@nbos/database';

import { deleteDevPayrollGraph } from '../payroll-runs/payroll-dev-postgres.cleanup';
import {
  PAYROLL_DEV_MARKER,
  PAYROLL_DEV_PAY_DATE,
  PAYROLL_DEV_POSTING_MONTH,
  PAYROLL_DEV_PREFIX,
  type DevPayrollIds,
} from '../payroll-runs/payroll-dev-postgres.ids';
import { seedPeopleAndCrm } from '../payroll-runs/payroll-dev-postgres.seed';
import { OperationalJournalService } from '../finance/journal/operational-journal.service';
import { PartnerAccrualClassicService } from '../finance/partner-accrual/partner-accrual-classic.service';
import { PartnerAccrualSubscriptionService } from '../finance/partner-accrual/partner-accrual-subscription.service';
import { PaymentsService } from '../finance/payments/payments.service';
import type { NotificationService } from '../notifications/notification.service';
import type { ClientPaidInvoiceAutomationService } from '../client-services/client-paid-invoice-automation.service';
import { guardedNamelessTermDatabaseUrl } from './sales-bonus-order-accrual.race-env';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const INVOICE_AMD = new Decimal('210000.00');
const FIRST_RECEIPT_AMD = new Decimal('100000.00');
const SECOND_RECEIPT_AMD = new Decimal('100000.00');
const FINAL_RECEIPT_AMD = new Decimal('10000.00');
const SELLER_PERCENT = new Decimal('8');
const ASSISTANT_PERCENT = new Decimal('2');
const SELLER_BONUS_AMD = INVOICE_AMD.mul(SELLER_PERCENT).div(100);
const ASSISTANT_BONUS_AMD = INVOICE_AMD.mul(ASSISTANT_PERCENT).div(100);
const CASE_TIMEOUT_MS = 120_000;
const SOURCE_CANDIDATES = ['NETWORK', 'CLIENT', 'SALES', 'MARKETING'] as const;

describe.skipIf(!DATABASE_URL)('V-19 invoice 210000 on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'accrues 16800 and 4200 once, only after 100000 + 100000 + 10000',
    async () => {
      const prisma = openClient();
      const ids = await seedPeopleAndCrm(prisma);
      try {
        const invoiceId = await seedQualifyingInvoice(prisma, ids);
        const { payments, accrual } = paymentService(prisma);
        await pay(payments, invoiceId, FIRST_RECEIPT_AMD, ids);
        await expectNoBonus(prisma, ids);
        await pay(payments, invoiceId, SECOND_RECEIPT_AMD, ids);
        await expectNoBonus(prisma, ids);
        await pay(payments, invoiceId, FINAL_RECEIPT_AMD, ids);
        await expectOneAccrual(prisma, ids);
        await accrual.onInvoicePaid(invoiceId);
        await expectOneAccrual(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  function openClient(): PrismaClient {
    const client = createPrismaClient({
      databaseUrl: DATABASE_URL ?? undefined,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
    clients.push(client);
    return client;
  }
});

async function seedQualifyingInvoice(prisma: PrismaClient, ids: DevPayrollIds): Promise<string> {
  requireId(ids.employeeIds[0], 'seller');
  const assistant = await prisma.employee.create({
    data: {
      firstName: 'Dev',
      lastName: `Assistant ${ids.runToken}`,
      email: `${PAYROLL_DEV_PREFIX}-asst-${ids.runToken}@nbos.invalid`.toLowerCase(),
      roleId: requireId(ids.roleId, 'role'),
      notes: PAYROLL_DEV_MARKER,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  ids.employeeIds.push(assistant.id);
  const source = await claimPolicySource(prisma);
  await prisma.deal.update({
    where: { id: requireId(ids.dealId, 'deal') },
    data: {
      source,
      sellerAssistantId: assistant.id,
      amount: INVOICE_AMD,
    },
  });
  await prisma.order.update({
    where: { id: requireId(ids.orderId, 'order') },
    data: { totalAmount: INVOICE_AMD },
  });
  const invoice = await prisma.invoice.create({
    data: {
      code: `${PAYROLL_DEV_PREFIX}-210-${ids.runToken}`,
      orderId: requireId(ids.orderId, 'order'),
      projectId: requireId(ids.projectId, 'project'),
      companyId: requireId(ids.companyId, 'company'),
      amount: INVOICE_AMD,
      taxStatus: 'TAX_FREE',
      type: 'DEVELOPMENT',
      moneyStatus: 'NEW',
      orderComment: 'FINAL_PHASE',
      dueDate: new Date('2099-12-31T00:00:00.000Z'),
      officialInvoiceRequestSent: false,
      notificationsEnabled: false,
      notes: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.invoiceIds.push(invoice.id);
  await rememberPostingMonth(prisma, ids);
  return invoice.id;
}

async function claimPolicySource(prisma: PrismaClient): Promise<LeadSourceEnum> {
  const open = await prisma.salesBonusPolicy.findMany({
    where: { paymentModel: 'CLASSIC', effectiveTo: null, isActive: true },
    select: { fromCategory: true, sellerPercent: true, assistantPercent: true },
  });
  const match = open.find(
    (row) =>
      new Decimal(row.sellerPercent).eq(SELLER_PERCENT) &&
      new Decimal(row.assistantPercent).eq(ASSISTANT_PERCENT) &&
      SOURCE_CANDIDATES.some((category) => category === row.fromCategory),
  );
  if (!match) {
    const seen = open
      .map((row) => `${row.fromCategory} ${row.sellerPercent}/${row.assistantPercent}`)
      .join(', ');
    throw new Error(
      `No open CLASSIC 8/2 policy to use without editing shared rates. Seen: ${seen}`,
    );
  }
  return match.fromCategory;
}

function paymentService(prisma: PrismaClient): {
  payments: PaymentsService;
  accrual: SalesBonusAccrualService;
} {
  const notifications = silentNotifications();
  const journal = new OperationalJournalService(prisma);
  const accrual = new SalesBonusAccrualService(prisma, notifications);
  const payments = new PaymentsService(
    prisma,
    accrual,
    notifications,
    journal,
    new PartnerAccrualClassicService(prisma, journal),
    new PartnerAccrualSubscriptionService(prisma, journal),
    silentClientAutomation(),
  );
  return { payments, accrual };
}

async function pay(
  payments: PaymentsService,
  invoiceId: string,
  amount: Decimal,
  ids: DevPayrollIds,
): Promise<void> {
  const created = await payments.create({
    invoiceId,
    amount: amount.toNumber(),
    paymentDate: PAYROLL_DEV_PAY_DATE,
    confirmedBy: ids.employeeIds[0],
    notes: PAYROLL_DEV_MARKER,
  });
  ids.paymentIds.push(created.id);
}

async function expectNoBonus(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: requireId(ids.invoiceIds[0], 'invoice') },
    select: { moneyStatus: true },
  });
  const count = await prisma.bonusEntry.count({ where: { orderId: ids.orderId } });
  expect(invoice.moneyStatus).not.toBe('PAID');
  expect(count).toBe(0);
}

async function expectOneAccrual(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: requireId(ids.invoiceIds[0], 'invoice') },
    select: { moneyStatus: true },
  });
  const rows = await prisma.bonusEntry.findMany({
    where: { orderId: ids.orderId, type: 'SALES' },
    select: { amount: true, employeeId: true },
  });
  expect(invoice.moneyStatus).toBe('PAID');
  expect(rows).toHaveLength(2);
  const amounts = rows.map((row) => row.amount.toFixed(2)).sort();
  expect(amounts).toEqual([ASSISTANT_BONUS_AMD.toFixed(2), SELLER_BONUS_AMD.toFixed(2)].sort());
  expect(SELLER_BONUS_AMD.toFixed(2)).toBe('16800.00');
  expect(ASSISTANT_BONUS_AMD.toFixed(2)).toBe('4200.00');
}

async function rememberPostingMonth(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const existing = await prisma.financePostingPeriod.findUnique({
    where: { monthKey: PAYROLL_DEV_POSTING_MONTH },
    select: { id: true },
  });
  if (!existing) {
    ids.createdPostingMonths.push(PAYROLL_DEV_POSTING_MONTH);
  }
}

function silentNotifications(): NotificationService {
  return new Proxy({}, { get: () => () => Promise.resolve(undefined) }) as NotificationService;
}

function silentClientAutomation(): ClientPaidInvoiceAutomationService {
  return {
    onInvoiceFullyPaid: async () => ({ taskId: null, expenseId: null }),
  } as ClientPaidInvoiceAutomationService;
}

function requireId(id: string | undefined, label: string): string {
  if (!id) throw new Error(`210000 fixture missing ${label}`);
  return id;
}
