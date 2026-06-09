import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { isGmailInsufficientScopeError } from './providers/gmail-oauth-scopes';
import type {
  ConnectionForAdapter,
  MailProviderAdapterFactory,
} from './providers/mail-provider-adapter.factory';

const logger = new Logger('MailThreadMarkReadProvider');

export interface MarkThreadReadProviderInput {
  threadId: string;
  mailAccountId: string;
  providerThreadId: string | null;
  providerMessageIds: string[];
}

function buildConnectionForAdapter(
  mailAccountId: string,
  emailAddress: string,
  displayName: string | null,
  providerType: string,
  connection: {
    username: string | null;
    imapHost: string | null;
    imapPort: number | null;
    secureMode: string | null;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpSecureMode: string | null;
  },
): ConnectionForAdapter {
  return {
    mailAccountId,
    emailAddress,
    displayName,
    providerType,
    username: connection.username,
    imapHost: connection.imapHost,
    imapPort: connection.imapPort,
    secureMode: connection.secureMode,
    smtpHost: connection.smtpHost,
    smtpPort: connection.smtpPort,
    smtpSecureMode: connection.smtpSecureMode,
  };
}

function providerMarkTargetsPresent(providerThreadId: string | null, ids: string[]): boolean {
  return Boolean(providerThreadId) || ids.length > 0;
}

async function flagProviderNeedsReconnect(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  detail: string,
): Promise<void> {
  await prisma.mailProviderConnection.updateMany({
    where: { mailAccountId, status: 'CONNECTED' },
    data: {
      status: 'NEEDS_RECONNECT',
      lastErrorAt: new Date(),
      lastErrorMessage: detail,
    },
  });
}

/**
 * Best-effort mark read on Gmail / IMAP after NBOS DB update.
 * Provider failures are logged; insufficient Gmail scopes flag NEEDS_RECONNECT.
 */
export async function markThreadReadOnProvider(
  prisma: InstanceType<typeof PrismaClient>,
  adapterFactory: MailProviderAdapterFactory,
  input: MarkThreadReadProviderInput,
): Promise<void> {
  if (!providerMarkTargetsPresent(input.providerThreadId, input.providerMessageIds)) {
    return;
  }

  const account = await prisma.mailAccount.findUnique({
    where: { id: input.mailAccountId },
    include: { providerConnection: true },
  });
  const connection = account?.providerConnection;
  if (!account || !connection) {
    return;
  }

  try {
    const adapter = await adapterFactory.forConnection(
      buildConnectionForAdapter(
        account.id,
        account.emailAddress,
        account.displayName,
        account.providerType,
        connection,
      ),
    );
    await adapter.markThreadRead({
      providerThreadId: input.providerThreadId,
      providerMessageIds: input.providerMessageIds,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Provider mark read failed';
    logger.warn(`Provider mark read failed for thread ${input.threadId}: ${detail}`);
    if (account.providerType === 'GMAIL' && isGmailInsufficientScopeError(error)) {
      await flagProviderNeedsReconnect(prisma, account.id, detail);
    }
  }
}

/** Collects provider ids for unread inbound messages before local read-state update. */
export async function listUnreadInboundProviderMessageIds(
  prisma: InstanceType<typeof PrismaClient>,
  threadId: string,
): Promise<string[]> {
  const unreadInbound = await prisma.emailMessage.findMany({
    where: {
      threadId,
      direction: 'INBOUND',
      readState: 'UNREAD',
      providerMessageId: { not: null },
    },
    select: { providerMessageId: true },
  });
  return unreadInbound
    .map((row) => row.providerMessageId)
    .filter((id): id is string => Boolean(id));
}
