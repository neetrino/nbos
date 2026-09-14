import type { Prisma } from '@nbos/database';

export function mailThreadListActivityWhere(options: {
  draftsOnly?: boolean;
  sentOnly?: boolean;
  spamOnly?: boolean;
  scope?: 'active' | 'trash';
}): Prisma.EmailThreadWhereInput {
  if (options.draftsOnly) {
    return {
      messages: {
        some: { direction: 'OUTBOUND', deliveryStatus: 'DRAFT' },
      },
    };
  }
  if (options.sentOnly) {
    return { lastOutboundAt: { not: null } };
  }
  if (options.scope === 'trash' || options.spamOnly) {
    return {};
  }
  return {
    OR: [{ lastInboundAt: { not: null } }, { lastOutboundAt: { not: null } }],
  };
}

/** Inbox badge: same visibility as the default All folder (no compose-only drafts). */
export function mailInboxThreadCountWhere(mailAccountIds: string[]): Prisma.EmailThreadWhereInput {
  return {
    mailAccountId: { in: mailAccountIds },
    isSpam: false,
    trashedAt: null,
    OR: [{ lastInboundAt: { not: null } }, { lastOutboundAt: { not: null } }],
  };
}
