import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, sql } from '@nbos/database';
import { ENTITY_CODE_SCOPE } from './entity-code-counter';
import {
  allocateDealCode,
  allocateInvoiceCode,
  allocateLeadCode,
  allocateOrderCode,
  allocateProjectCode,
  allocateSubscriptionCode,
  allocateSupportTicketCode,
} from './entity-code-series';
import { ENTITY_CODE_SEED_SERIES } from './entity-code-seed';
import { LeadsService } from '../../modules/crm/leads/leads.service';
import { SupportService } from '../../modules/support/support.service';

/**
 * Production-path allocator evidence for C25. Opt-in: `AI_PLATFORM_DB_TEST_URL`.
 * Uses isolated probe years so it never advances a live 2026 series.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const CONCURRENT_ALLOCATIONS = 20;
const PROBE_YEAR = 2996;
const CASE_TIMEOUT_MS = 120_000;
const SIBLING_MIGRATION_PATH = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../../packages/database/prisma/migrations/20260823120000_seed_sibling_entity_code_counters/migration.sql',
);

const namedAllocators = [
  { scope: ENTITY_CODE_SCOPE.invoice, allocate: allocateInvoiceCode },
  { scope: ENTITY_CODE_SCOPE.supportTicket, allocate: allocateSupportTicketCode },
  { scope: ENTITY_CODE_SCOPE.deal, allocate: allocateDealCode },
  { scope: ENTITY_CODE_SCOPE.lead, allocate: allocateLeadCode },
  { scope: ENTITY_CODE_SCOPE.order, allocate: allocateOrderCode },
  { scope: ENTITY_CODE_SCOPE.subscription, allocate: allocateSubscriptionCode },
  { scope: ENTITY_CODE_SCOPE.project, allocate: allocateProjectCode },
] as const;

describe.skipIf(!DATABASE_URL)('sibling entity code series (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  const runId = `code-c25-${randomUUID()}`;

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
  });

  afterAll(async () => {
    await prisma.entityCodeCounter.deleteMany({
      where: { year: PROBE_YEAR, scope: { in: namedAllocators.map((item) => item.scope) } },
    });
    await prisma.lead.deleteMany({ where: { name: { startsWith: runId } } });
    await prisma.supportTicket.deleteMany({ where: { title: { startsWith: runId } } });
    await prisma.$disconnect();
  });

  it(
    'allocates distinct numbers concurrently for every sibling series',
    async () => {
      for (const series of namedAllocators) {
        const codes = await Promise.all(
          Array.from({ length: CONCURRENT_ALLOCATIONS }, () => series.allocate(prisma, PROBE_YEAR)),
        );
        expect(new Set(codes).size).toBe(CONCURRENT_ALLOCATIONS);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it('crosses the 9999 → 10000 boundary on the invoice series', async () => {
    await prisma.entityCodeCounter.upsert({
      where: { scope_year: { scope: ENTITY_CODE_SCOPE.invoice, year: PROBE_YEAR } },
      create: {
        scope: ENTITY_CODE_SCOPE.invoice,
        year: PROBE_YEAR,
        nextValue: 9999,
      },
      update: { nextValue: 9999 },
    });

    expect(await allocateInvoiceCode(prisma, PROBE_YEAR)).toBe(`INV-${PROBE_YEAR}-10000`);
  });

  it('seeds the numeric max from VALUES, ignoring malformed and beating lexicographic order', async () => {
    const rows = await prisma.$queryRaw<Array<{ next_value: number }>>(sql`
      SELECT MAX(CAST(SUBSTRING("code" FROM '^INV-\\d{4}-(\\d+)$') AS INTEGER)) AS next_value
      FROM (
        VALUES
          (${`INV-${PROBE_YEAR}-9999`}),
          (${`INV-${PROBE_YEAR}-10000`}),
          (${`INV-${PROBE_YEAR}-foo`}),
          (${`INV-${PROBE_YEAR}-0998`}),
          ('not-a-code')
      ) AS t("code")
      WHERE "code" ~ '^INV-\\d{4}-\\d+$'
    `);

    expect(rows[0]?.next_value).toBe(10000);
  });

  it(
    'gives LeadsService and SupportService distinct codes under parallel creates',
    async () => {
      const leads = new LeadsService(
        prisma as never,
        { log: () => Promise.resolve({ id: 'a' }) } as never,
      );
      const support = new SupportService(
        prisma as never,
        { log: () => Promise.resolve(undefined) } as never,
        { create: () => Promise.resolve({ id: 'n' }) } as never,
        {} as never,
      );

      const [leadResults, ticketResults] = await Promise.all([
        Promise.all(
          Array.from({ length: 8 }, (_, index) =>
            leads.create({ name: `${runId} lead ${index}`, contactName: 'Probe' }),
          ),
        ),
        Promise.all(
          Array.from({ length: 8 }, (_, index) =>
            support.create({ title: `${runId} ticket ${index}` }),
          ),
        ),
      ]);

      const leadCodes = leadResults.map((row) => row.code);
      const ticketCodes = ticketResults.map((row) => row.code);
      expect(new Set(leadCodes).size).toBe(8);
      expect(new Set(ticketCodes).size).toBe(8);
    },
    CASE_TIMEOUT_MS,
  );
});

describe('sibling entity code seed migration', () => {
  it('contains a numeric seed for every affected series', () => {
    const sqlText = readFileSync(SIBLING_MIGRATION_PATH, 'utf8');
    for (const series of ENTITY_CODE_SEED_SERIES) {
      if (series.scope === ENTITY_CODE_SCOPE.task) {
        continue;
      }
      expect(sqlText).toContain(`'${series.scope}'`);
      expect(sqlText).toContain(`FROM "${series.table}"`);
      expect(sqlText).toContain(
        `MAX(CAST(SUBSTRING("code" FROM '^${series.prefix}-\\d{4}-(\\d+)$') AS INTEGER))`,
      );
    }
  });
});
