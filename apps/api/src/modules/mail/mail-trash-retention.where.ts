import type { Prisma } from '@nbos/database';
import { PLATFORM_DEFAULT_TRASH_RETENTION_DAYS } from '../../common/lifecycle/platform-trash-inventory.registry';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_MS = PLATFORM_DEFAULT_TRASH_RETENTION_DAYS * MS_PER_DAY;

/** Trashed mail threads past retention eligible for hard purge. */
export function trashedMailThreadRetentionWhere(
  now: Date,
  retentionMs: number = DEFAULT_RETENTION_MS,
): Prisma.EmailThreadWhereInput {
  const cutoff = new Date(now.getTime() - retentionMs);
  return {
    trashedAt: { not: null, lt: cutoff },
  };
}
