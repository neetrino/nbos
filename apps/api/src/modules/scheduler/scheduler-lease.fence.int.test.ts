import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { isSchedulerLeaseHeld } from './scheduler-lease.fence';
import { SchedulerLeaseService } from './scheduler-lease.service';
import type { SchedulerRunService } from './scheduler-run.service';

/**
 * Lease fencing against a real PostgreSQL database.
 *
 * The unit tests prove the statement and the call order; only a real database
 * proves the contention this control exists for: while the previous owner holds
 * its lease row inside a write transaction, the successor's `acquire` must wait
 * instead of taking the job over, and once it does take over, the previous
 * owner's token must stop matching.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database. The test uses
 * lease rows under its own generated job names and deletes them afterwards.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const LEASE_TTL_MS = 3_000;
const EXPIRY_MARGIN_MS = 500;
const CONTENTION_PROBE_MS = 750;
const SUCCESSOR_TTL_MS = 30_000;
const TRANSACTION_TIMEOUT_MS = 60_000;
const CASE_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Lets the test assert that a promise is still pending, i.e. blocked on a lock. */
function track<T>(promise: Promise<T>): { promise: Promise<T>; isPending: () => boolean } {
  let pending = true;
  const tracked = promise.finally(() => {
    pending = false;
  });
  return { promise: tracked, isPending: () => pending };
}

describe.skipIf(!DATABASE_URL)('scheduler lease fencing (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let leases: SchedulerLeaseService;
  const jobNames: string[] = [];

  function nextJobName(): string {
    const jobName = `fence-probe-${randomUUID()}`;
    jobNames.push(jobName);
    return jobName;
  }

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    leases = new SchedulerLeaseService(prisma, {} as SchedulerRunService);
  });

  /**
   * `lease_until` is written by the application clock and compared against the
   * database clock, and the two are neither identical nor close over a remote
   * connection. Waiting by the local clock alone made this test flap, so expiry
   * is measured on the database's own timeline.
   */
  async function millisecondsUntilExpiry(leaseUntil: Date): Promise<number> {
    const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
    const skewMs = row.now.getTime() - Date.now();
    return leaseUntil.getTime() - skewMs - Date.now();
  }

  afterAll(async () => {
    await prisma.schedulerLease.deleteMany({ where: { jobName: { in: jobNames } } });
    await prisma.$disconnect();
  });

  it(
    'blocks a takeover while the fenced transaction is open, then retires the old token',
    async () => {
      const jobName = nextJobName();
      const first = await leases.acquire(jobName, 'owner-a', LEASE_TTL_MS);
      expect(first).not.toBeNull();
      const previous = { jobName, ownerId: 'owner-a', fencingToken: first!.fencingToken };

      let successor!: ReturnType<typeof track<Awaited<ReturnType<typeof leases.acquire>>>>;
      await prisma.$transaction(
        async (tx) => {
          expect(await isSchedulerLeaseHeld(tx, previous)).toBe(true);
          // The lease expires while the row stays locked by this transaction:
          // the successor is now entitled to take over and must still wait.
          await sleep((await millisecondsUntilExpiry(first!.leaseUntil)) + EXPIRY_MARGIN_MS);
          successor = track(leases.acquire(jobName, 'owner-b', SUCCESSOR_TTL_MS));
          await sleep(CONTENTION_PROBE_MS);
          expect(successor.isPending()).toBe(true);
        },
        { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_TIMEOUT_MS },
      );

      const second = await successor.promise;
      expect(second?.fencingToken).toBe(first!.fencingToken + 1n);

      await prisma.$transaction(async (tx) => {
        expect(await isSchedulerLeaseHeld(tx, previous)).toBe(false);
        expect(
          await isSchedulerLeaseHeld(tx, {
            jobName,
            ownerId: 'owner-b',
            fencingToken: second!.fencingToken,
          }),
        ).toBe(true);
      });
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'refuses an owner whose lease expired even when nobody took it over',
    async () => {
      const jobName = nextJobName();
      const handle = await leases.acquire(jobName, 'owner-c', LEASE_TTL_MS);
      expect(handle).not.toBeNull();
      await sleep((await millisecondsUntilExpiry(handle!.leaseUntil)) + EXPIRY_MARGIN_MS);

      await prisma.$transaction(async (tx) => {
        expect(
          await isSchedulerLeaseHeld(tx, {
            jobName,
            ownerId: 'owner-c',
            fencingToken: handle!.fencingToken,
          }),
        ).toBe(false);
      });
    },
    CASE_TIMEOUT_MS,
  );
});
