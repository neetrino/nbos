import { PrismaClient } from '@nbos/database';
import { ensureMetaClientConversation } from './messenger-meta-ensure.ops';
import { persistMetaInboundCoreMessage } from './messenger-meta-inbound.ops';
import { metaProviderFromPlatform, metaProviderMessageKey } from './messenger-meta-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MetaSalesMapReport = {
  conversationsSeen: number;
  conversationsMapped: number;
  conversationsReused: number;
  messagesSeen: number;
  messagesMapped: number;
  messagesSkippedExisting: number;
};

type MetaSourceRow = {
  id: string;
  leadId: string | null;
  metaConnectedAccountId: string;
  senderIdentity: { displayName: string | null; username: string | null };
  metaConnectedAccount: { platform: string };
  messages: Array<{
    id: string;
    providerMessageId: string;
    text: string | null;
    direction: 'INBOUND' | 'OUTBOUND';
    sentAt: Date | null;
    receivedAt: Date;
  }>;
};

export async function mapAllMetaSalesToCore(prisma: PrismaLike): Promise<MetaSalesMapReport> {
  const rows = await prisma.metaConversation.findMany({
    include: {
      senderIdentity: { select: { displayName: true, username: true } },
      metaConnectedAccount: { select: { platform: true } },
      messages: { orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }] },
    },
  });
  const report = emptyMetaMapReport();
  for (const row of rows) {
    mergeMetaMapReport(report, await mapMetaConversationToCore(prisma, row));
  }
  return report;
}

export async function mapMetaConversationToCore(
  prisma: PrismaLike,
  row: MetaSourceRow,
): Promise<MetaSalesMapReport> {
  const report = emptyMetaMapReport();
  report.conversationsSeen = 1;
  report.messagesSeen = row.messages.length;
  const ensured = await ensureMetaClientConversation(prisma, {
    metaConversationId: row.id,
    provider: metaProviderFromPlatform(row.metaConnectedAccount.platform),
    providerAccountId: row.metaConnectedAccountId,
    title: metaConversationTitle(row),
    leadId: row.leadId,
  });
  if (ensured.created) report.conversationsMapped = 1;
  else report.conversationsReused = 1;
  const senderName = metaConversationTitle(row);
  for (const message of row.messages) {
    const persisted = await persistMetaInboundCoreMessage(prisma, {
      conversationId: ensured.id,
      providerMessageKey: metaProviderMessageKey(
        row.metaConnectedAccount.platform,
        row.metaConnectedAccountId,
        message.providerMessageId,
      ),
      content: message.text?.trim() ? message.text : '',
      senderName,
      direction: message.direction === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND',
      createdAt: message.sentAt ?? message.receivedAt,
    });
    if (persisted.created) report.messagesMapped += 1;
    else report.messagesSkippedExisting += 1;
  }
  return report;
}

function metaConversationTitle(row: MetaSourceRow): string {
  return row.senderIdentity.displayName?.trim() || row.senderIdentity.username?.trim() || 'Client';
}

function emptyMetaMapReport(): MetaSalesMapReport {
  return {
    conversationsSeen: 0,
    conversationsMapped: 0,
    conversationsReused: 0,
    messagesSeen: 0,
    messagesMapped: 0,
    messagesSkippedExisting: 0,
  };
}

function mergeMetaMapReport(target: MetaSalesMapReport, next: MetaSalesMapReport): void {
  target.conversationsSeen += next.conversationsSeen;
  target.conversationsMapped += next.conversationsMapped;
  target.conversationsReused += next.conversationsReused;
  target.messagesSeen += next.messagesSeen;
  target.messagesMapped += next.messagesMapped;
  target.messagesSkippedExisting += next.messagesSkippedExisting;
}
