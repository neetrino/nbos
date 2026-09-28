import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@nbos/database';

import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { BROWSER_BONUS_MONTH } from './payroll-dev-browser-bonus.ids';
import { prepareBrowserBonusFixture } from './payroll-dev-browser-bonus.seed';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();

describe.skipIf(!DATABASE_URL)('prepare the 2020-02 browser bonus fixture', () => {
  it('leaves one synthetic employee and two delivery bonuses', async () => {
    const prisma = createPrismaClient({
      databaseUrl: DATABASE_URL ?? undefined,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
    try {
      const ids = await prepareBrowserBonusFixture(prisma);
      const run = await prisma.payrollRun.findUnique({
        where: { payrollMonth: BROWSER_BONUS_MONTH },
        select: { id: true },
      });
      expect(run).toBeNull();
      expect(ids.employeeIds).toHaveLength(1);
      expect(ids.entryIds).toHaveLength(2);
    } finally {
      await prisma.$disconnect();
    }
  }, 90_000);
});
