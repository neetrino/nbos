import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { allocateEntityCodeNumber, type EntityCodeScope } from './entity-code-counter';

/**
 * Concurrent code allocation against a real PostgreSQL database.
 *
 * This is the regression for the defect recorded as C23: generating a code by
 * reading the current maximum and then inserting raced, so parallel Task
 * creation returned HTTP 500 on the `tasks.code` unique constraint. Only a real
 * database proves the fix, because the guarantee comes from PostgreSQL
 * serializing concurrent upserts on the counter row — a mocked client cannot
 * exhibit that contention.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database. The test uses
 * its own generated scopes and deletes them afterwards, so it never touches the
 * live `TASK` series.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const CONCURRENT_ALLOCATIONS = 40;
const PROBE_YEAR = 2999;
const CASE_TIMEOUT_MS = 120_000;

describe.skipIf(!DATABASE_URL)('entity code counter (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  const scopes: string[] = [];

  function nextScope(): EntityCodeScope {
    const scope = `PROBE-${randomUUID()}`;
    scopes.push(scope);
    return scope as EntityCodeScope;
  }

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
  });

  afterAll(async () => {
    await prisma.entityCodeCounter.deleteMany({ where: { scope: { in: scopes } } });
    await prisma.$disconnect();
  });

  it(
    'hands every concurrent caller a distinct number',
    async () => {
      const scope = nextScope();

      const numbers = await Promise.all(
        Array.from({ length: CONCURRENT_ALLOCATIONS }, () =>
          allocateEntityCodeNumber(prisma, scope, PROBE_YEAR),
        ),
      );

      expect(new Set(numbers).size).toBe(CONCURRENT_ALLOCATIONS);
      expect([...numbers].sort((a, b) => a - b)).toEqual(
        Array.from({ length: CONCURRENT_ALLOCATIONS }, (_, i) => i + 1),
      );
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'keeps scopes and years independent',
    async () => {
      const first = nextScope();
      const second = nextScope();

      expect(await allocateEntityCodeNumber(prisma, first, PROBE_YEAR)).toBe(1);
      expect(await allocateEntityCodeNumber(prisma, first, PROBE_YEAR)).toBe(2);
      expect(await allocateEntityCodeNumber(prisma, second, PROBE_YEAR)).toBe(1);
      expect(await allocateEntityCodeNumber(prisma, first, PROBE_YEAR + 1)).toBe(1);
      expect(await allocateEntityCodeNumber(prisma, first, PROBE_YEAR)).toBe(3);
    },
    CASE_TIMEOUT_MS,
  );
});
