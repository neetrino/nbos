import type { Prisma } from '@nbos/database';
import { resolveRetentionMsForEntity } from '../../common/lifecycle/platform-retention-rules.resolver';
import { CREDENTIAL_TRASH_RETENTION_MS } from './credential-trash-retention.constants';

export function trashedCredentialRetentionWhere(
  now: Date,
  retentionMs?: number,
): Prisma.CredentialWhereInput {
  const ms =
    retentionMs ?? resolveRetentionMsForEntity('credential') ?? CREDENTIAL_TRASH_RETENTION_MS;
  const cutoff = new Date(now.getTime() - ms);
  return { trashedAt: { not: null, lt: cutoff } };
}
