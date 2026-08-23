import {
  allocateEntityCodeNumber,
  ENTITY_CODE_SCOPE,
  type EntityCodePrismaClient,
} from '../../common/utils/entity-code-counter';

/**
 * Task codes look like `T-{year}-{NNNN}` (zero-padded decimal suffix).
 *
 * The padding is a minimum rather than a width — once a year passes 9999 the
 * code simply grows, which is why the suffix must never be compared as text.
 */
export function formatTaskCode(year: number, numericSuffix: number): string {
  return `T-${year}-${String(numericSuffix).padStart(4, '0')}`;
}

/**
 * The only supported way to obtain a Task code.
 *
 * Every writer must come through here. Deriving a code from `max(tasks)`
 * instead races with concurrent creates, and — once any writer allocates from
 * the counter — a single `max`-derived insert is enough to leave the counter
 * behind the table, so the next allocation collides with no concurrency at all.
 * That is why Support and Automation call this rather than keeping their own
 * generators.
 *
 * The client must commit this statement on its own. Passing an open
 * interactive transaction that still writes the task and an idempotency
 * checkpoint holds the counter lock for the whole transaction (C26).
 */
export async function allocateTaskCode(prisma: EntityCodePrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const numericSuffix = await allocateEntityCodeNumber(prisma, ENTITY_CODE_SCOPE.task, year);
  return formatTaskCode(year, numericSuffix);
}
