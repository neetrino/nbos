import { ConflictException } from '@nestjs/common';
import type { MailAccountStatus, PrismaClient } from '@nbos/database';

export const MAIL_DISABLED_STATUS = 'DISABLED' satisfies MailAccountStatus;

export const MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE =
  'This mailbox is already connected. Ask the owner to share access instead of connecting it again.';

export const MAIL_DUPLICATE_LIVE_MAILBOX_MESSAGE =
  'This mailbox already has more than one live connection. Contact an admin to clean up duplicates.';

export function normalizeMailboxEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isLiveMailboxStatus(status: MailAccountStatus): boolean {
  return status !== MAIL_DISABLED_STATUS;
}

export type MailboxUniquenessRow = {
  id: string;
  ownerEmployeeId: string | null;
  status: MailAccountStatus;
  createdAt: Date;
};

export type MailboxConnectResolution<T extends MailboxUniquenessRow> =
  | { kind: 'reuse'; account: T }
  | { kind: 'create' };

export function pickMailboxForReconnect<T extends MailboxUniquenessRow>(rows: T[]): T | null {
  if (rows.length === 0) {
    return null;
  }
  const live = rows.filter((row) => isLiveMailboxStatus(row.status));
  const pool = live.length > 0 ? live : rows;
  const sorted = [...pool].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
  return sorted[0] ?? null;
}

export function resolveMailboxConnectTarget<T extends MailboxUniquenessRow>(
  ownerEmployeeId: string,
  rows: T[],
): MailboxConnectResolution<T> {
  const live = rows.filter((row) => isLiveMailboxStatus(row.status));
  if (live.length > 1) {
    throw new ConflictException(MAIL_DUPLICATE_LIVE_MAILBOX_MESSAGE);
  }
  const foreignLive = live.find((row) => row.ownerEmployeeId !== ownerEmployeeId);
  if (foreignLive) {
    throw new ConflictException(MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE);
  }
  const owned = rows.filter((row) => row.ownerEmployeeId === ownerEmployeeId);
  const reuse = pickMailboxForReconnect(owned);
  if (reuse) {
    return { kind: 'reuse', account: reuse };
  }
  return { kind: 'create' };
}

export async function listMailboxesByEmail(
  prisma: InstanceType<typeof PrismaClient>,
  emailAddress: string,
) {
  return prisma.mailAccount.findMany({
    where: {
      emailAddress: { equals: normalizeMailboxEmail(emailAddress), mode: 'insensitive' },
    },
    include: { providerConnection: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveMailboxForConnect(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  emailAddress: string,
) {
  const rows = await listMailboxesByEmail(prisma, emailAddress);
  return resolveMailboxConnectTarget(ownerEmployeeId, rows);
}

export async function assertNoOtherLiveMailbox(
  prisma: InstanceType<typeof PrismaClient>,
  emailAddress: string,
  excludeAccountId: string,
): Promise<void> {
  const rows = await listMailboxesByEmail(prisma, emailAddress);
  const liveOthers = rows.filter(
    (row) => isLiveMailboxStatus(row.status) && row.id !== excludeAccountId,
  );
  if (liveOthers.length > 1) {
    throw new ConflictException(MAIL_DUPLICATE_LIVE_MAILBOX_MESSAGE);
  }
  if (liveOthers.length === 1) {
    throw new ConflictException(MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE);
  }
}
