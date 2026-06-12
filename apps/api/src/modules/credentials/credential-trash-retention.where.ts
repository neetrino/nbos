import type { Prisma } from '@nbos/database';
import { CREDENTIAL_TRASH_RETENTION_MS } from './credential-trash-retention.constants';

export function trashedCredentialRetentionWhere(now: Date): Prisma.CredentialWhereInput {
  const cutoff = new Date(now.getTime() - CREDENTIAL_TRASH_RETENTION_MS);
  return { archivedAt: { lt: cutoff } };
}
