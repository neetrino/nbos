import { sql, type PrismaClient } from '@nbos/database';

/**
 * Scopes sharing the `entity_code_counters` table. Each scope owns an
 * independent per-year series, so `TASK` and `INVOICE` never contend.
 */
export const ENTITY_CODE_SCOPE = {
  task: 'TASK',
} as const;

export type EntityCodeScope = (typeof ENTITY_CODE_SCOPE)[keyof typeof ENTITY_CODE_SCOPE];

/** Narrow surface an allocator needs, so callers can pass a client or a transaction. */
export type EntityCodePrismaClient = Pick<InstanceType<typeof PrismaClient>, '$queryRaw'>;

/**
 * Atomically reserves the next number for a scope and year.
 *
 * A single upsert does the read and the increment inside one statement, so
 * concurrent callers are serialized by PostgreSQL on the counter row instead of
 * racing to compute the same value and colliding on a unique code column.
 *
 * Numbers are reserved, not reissued: if the caller's insert later fails the
 * number is skipped. Gaps are acceptable in a human-readable code; duplicates
 * are not.
 *
 * Call this as a short committed statement. Passing an open interactive
 * transaction that still has other work to do holds the counter row until
 * that transaction commits, and concurrent allocators then time out (C26).
 */
export async function allocateEntityCodeNumber(
  prisma: EntityCodePrismaClient,
  scope: EntityCodeScope,
  year: number,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ next_value: number }>>(sql`
    INSERT INTO "entity_code_counters" ("scope", "year", "next_value", "updated_at")
    VALUES (${scope}, ${year}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("scope", "year") DO UPDATE
      SET "next_value" = "entity_code_counters"."next_value" + 1,
          "updated_at" = CURRENT_TIMESTAMP
    RETURNING "next_value"
  `);

  const next = rows[0]?.next_value;
  if (typeof next !== 'number') {
    throw new Error(`Code counter for ${scope}/${year} returned no value`);
  }
  return next;
}
