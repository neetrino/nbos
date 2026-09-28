import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { persistLockedCappedSalesBonusRows } from './sales-bonus-order-accrual-write';
import { SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD } from './sales-bonus-combined-accrual';
import { guardedNamelessTermDatabaseUrl } from './sales-bonus-order-accrual.race-env';
import {
  deleteV13RaceGraph,
  emptyV13RaceFixture,
  seedV13RaceGraph,
  V13_ASSISTANT_PERCENT,
  V13_OVER_CAP_BASE_AMD,
  V13_RACE_EARNED_PERIOD,
  V13_RACE_MARKER,
  V13_SELLER_PERCENT,
  type V13RaceFixture,
} from './sales-bonus-order-accrual.race-fixture';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const CASE_TIMEOUT_MS = 60_000;

describe.skipIf(!DATABASE_URL)('V-13 Sales order envelope race (real PostgreSQL)', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'caps concurrent unslotted accruals and refuses a second pair on the same invoice',
    async () => {
      const prisma = openClient();
      const racer = openClient();
      clients.push(prisma, racer);
      const fixture = emptyV13RaceFixture();
      try {
        await seedV13RaceGraph(prisma, fixture);
        await runEnvelopeRace(prisma, racer, fixture);
      } finally {
        await deleteV13RaceGraph(prisma, fixture);
      }
    },
    CASE_TIMEOUT_MS,
  );

  function openClient(): PrismaClient {
    return createPrismaClient({
      databaseUrl: DATABASE_URL ?? undefined,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
  }
});

async function runEnvelopeRace(
  prisma: PrismaClient,
  racer: PrismaClient,
  fixture: V13RaceFixture,
): Promise<void> {
  const orderId = requireId(fixture.orderId, 'order');
  const invoiceAId = requireId(fixture.invoiceAId, 'invoiceA');
  const invoiceBId = requireId(fixture.invoiceBId, 'invoiceB');
  await Promise.all([
    persistLockedCappedSalesBonusRows(cappedWriteInput(prisma, fixture, invoiceAId)),
    persistLockedCappedSalesBonusRows(cappedWriteInput(racer, fixture, invoiceBId)),
  ]);
  const afterRace = await loadSalesRows(prisma, orderId);
  const combined = sumAmounts(afterRace);
  expect(combined.toFixed(2), `combined stored ${combined.toFixed(2)}`).toBe(
    SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD.toFixed(2),
  );
  expect(combined.lte(SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD)).toBe(true);
  const invoiceACount = countForInvoice(afterRace, invoiceAId);
  await persistLockedCappedSalesBonusRows(cappedWriteInput(prisma, fixture, invoiceAId));
  const afterReplay = await loadSalesRows(prisma, orderId);
  expect(countForInvoice(afterReplay, invoiceAId)).toBe(invoiceACount);
  expect(sumAmounts(afterReplay).toFixed(2)).toBe(combined.toFixed(2));
}

function cappedWriteInput(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
  invoiceId: string,
): Parameters<typeof persistLockedCappedSalesBonusRows>[0] {
  return {
    prisma,
    order: {
      id: requireId(fixture.orderId, 'order'),
      projectId: requireId(fixture.projectId, 'project'),
    },
    deal: {
      id: requireId(fixture.dealId, 'deal'),
      sellerId: requireId(fixture.sellerId, 'seller'),
      sellerAssistantId: requireId(fixture.assistantId, 'assistant'),
    },
    policy: { sellerPercent: V13_SELLER_PERCENT, assistantPercent: V13_ASSISTANT_PERCENT },
    baseAmount: V13_OVER_CAP_BASE_AMD,
    snapshotJson: { marker: V13_RACE_MARKER, invoiceId, orderId: fixture.orderId ?? '' },
    invoiceId,
    slotMode: null,
    earnedPeriod: V13_RACE_EARNED_PERIOD,
  };
}

type SalesAmountRow = {
  amount: Decimal;
  salesAccrualInvoiceId: string | null;
};

async function loadSalesRows(prisma: PrismaClient, orderId: string): Promise<SalesAmountRow[]> {
  return prisma.bonusEntry.findMany({
    where: { orderId, type: 'SALES' },
    select: { amount: true, salesAccrualInvoiceId: true },
  });
}

function sumAmounts(rows: SalesAmountRow[]): Decimal {
  return rows.reduce((total, row) => total.plus(row.amount), new Decimal(0));
}

function countForInvoice(rows: SalesAmountRow[], invoiceId: string): number {
  return rows.filter((row) => row.salesAccrualInvoiceId === invoiceId).length;
}

function requireId(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(`V-13 race fixture missing ${label}`);
  }
  return id;
}
