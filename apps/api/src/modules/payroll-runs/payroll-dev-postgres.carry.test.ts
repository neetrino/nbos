import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';
import { deleteDevPayrollGraph } from './payroll-dev-postgres.cleanup';
import {
  CARRY_APRIL_INCLUDED,
  CARRY_APRIL_ORIGINAL,
  CARRY_APRIL_REMAINING,
  CARRY_JUNE_APPLIED,
  CARRY_MAY_ORIGINAL,
  CARRY_MAY_REMAINING,
  seedClosedCarryChain,
  seedOpenCarryChain,
  type CarryChainIds,
} from './payroll-dev-postgres.carry-fixture';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const CASE_TIMEOUT_MS = 90_000;
const APRIL_RESTORED_INCLUDED = '80000.00';
const MAY_RESTORED_INCLUDED = '40000.00';
const MAY_RESTORED_CARRY = '40000.00';

describe.skipIf(!DATABASE_URL)('payroll carry chains on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'does not restore carry onto a closed source month',
    async () => {
      const prisma = openClient();
      const ids = await seedClosedCarryChain(prisma);
      try {
        await expect(detachTiny(prisma, ids)).rejects.toThrow(/closed or paid/);
        const source = await loadRelease(prisma, ids.oldestReleaseId);
        const line = await loadLine(prisma, ids.newestRunId);
        expect(source.payrollCarryOverRemaining?.toFixed(2)).toBe(CARRY_APRIL_REMAINING);
        expect(source.payrollIncludedAmount?.toFixed(2)).toBe(CARRY_APRIL_INCLUDED);
        expect(line.payrollCarryAppliedAmount?.toFixed(2)).toBe(CARRY_APRIL_INCLUDED);
        expect(line.bonusesTotal.toFixed(2)).toBe(
          new Decimal(CARRY_APRIL_INCLUDED).plus('1.00').toFixed(2),
        );
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'restores the oldest open month first and does not restore again',
    async () => {
      const prisma = openClient();
      const ids = await seedOpenCarryChain(prisma);
      try {
        await detachTiny(prisma, ids);
        await expect(detachTiny(prisma, ids)).rejects.toThrow();
        await expectOpenChain(prisma, ids);
      } finally {
        await deleteDevPayrollGraph(prisma, ids);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'does not restore the same carry twice when two detaches run together',
    async () => {
      const first = openClient();
      const second = openClient();
      const ids = await seedOpenCarryChain(first);
      try {
        const results = await Promise.allSettled([detachTiny(first, ids), detachTiny(second, ids)]);
        const fulfilled = results.filter((row) => row.status === 'fulfilled');
        expect(fulfilled).toHaveLength(1);
        await expectOpenChain(first, ids);
      } finally {
        await deleteDevPayrollGraph(first, ids);
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

function detachTiny(prisma: PrismaClient, ids: CarryChainIds): Promise<void> {
  return prisma.$transaction((tx) =>
    detachBonusReleasesFromPayrollRun(tx, {
      payrollRunId: ids.newestRunId,
      releaseIds: [ids.tinyReleaseId],
    }),
  );
}

async function expectOpenChain(prisma: PrismaClient, ids: CarryChainIds): Promise<void> {
  const oldest = await loadRelease(prisma, ids.oldestReleaseId);
  const middleId = ids.middleReleaseId;
  if (!middleId) throw new Error('open carry chain missing the middle release');
  const middle = await loadRelease(prisma, middleId);
  const newest = await loadLine(prisma, ids.newestRunId);
  expect(oldest.payrollIncludedAmount?.toFixed(2)).toBe(APRIL_RESTORED_INCLUDED);
  expect(oldest.payrollCarryOverAmount?.toFixed(2)).toBe(CARRY_APRIL_REMAINING);
  expect(oldest.payrollCarryOverRemaining?.toFixed(2)).toBe(CARRY_APRIL_REMAINING);
  expect(middle.payrollIncludedAmount?.toFixed(2)).toBe(MAY_RESTORED_INCLUDED);
  expect(middle.payrollCarryOverAmount?.toFixed(2)).toBe(MAY_RESTORED_CARRY);
  expect(middle.payrollCarryOverRemaining?.toFixed(2)).toBe(CARRY_MAY_REMAINING);
  expect(newest.payrollCarryAppliedAmount).toBeNull();
  expect(newest.bonusesTotal.eq(0)).toBe(true);
  expect(new Decimal(CARRY_APRIL_ORIGINAL).plus(CARRY_MAY_ORIGINAL).gte(CARRY_JUNE_APPLIED)).toBe(
    true,
  );
}

function loadRelease(prisma: PrismaClient, id: string) {
  return prisma.bonusRelease.findUniqueOrThrow({
    where: { id },
    select: {
      payrollIncludedAmount: true,
      payrollCarryOverAmount: true,
      payrollCarryOverRemaining: true,
    },
  });
}

function loadLine(prisma: PrismaClient, payrollRunId: string) {
  return prisma.salaryLine.findFirstOrThrow({
    where: { payrollRunId },
    select: { bonusesTotal: true, payrollCarryAppliedAmount: true },
  });
}
