import { ConflictException } from '@nestjs/common';
import type { MailProviderType, PrismaClient } from '@nbos/database';
import {
  MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE,
  normalizeMailboxEmail,
  resolveMailboxForConnect,
} from './mail-account-uniqueness.ops';
import { isUniqueConstraintError } from './mail-unique-violation';

const GMAIL_PROVIDER: MailProviderType = 'GMAIL';

function gmailConnectionWrite(email: string, grantedScopes: string[]) {
  return {
    providerType: GMAIL_PROVIDER,
    status: 'CONNECTED' as const,
    providerAccountId: email,
    grantedScopes,
    lastValidatedAt: new Date(),
  };
}

export async function upsertGmailMailbox(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  emailAddress: string,
  grantedScopes: string[],
): Promise<string> {
  const email = normalizeMailboxEmail(emailAddress);
  const existing = await resolveMailboxForConnect(prisma, ownerEmployeeId, email);
  if (existing.kind === 'reuse') {
    await writeGmailMailboxConnected(prisma, existing.account.id, email, grantedScopes);
    return existing.account.id;
  }
  try {
    const created = await createGmailMailbox(prisma, ownerEmployeeId, email, grantedScopes);
    return created.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

async function writeGmailMailboxConnected(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  email: string,
  grantedScopes: string[],
): Promise<void> {
  await prisma.mailAccount.update({
    where: { id: mailAccountId },
    data: {
      emailAddress: email,
      providerType: GMAIL_PROVIDER,
      status: 'ACTIVE',
      providerConnection: {
        upsert: {
          create: gmailConnectionWrite(email, grantedScopes),
          update: {
            ...gmailConnectionWrite(email, grantedScopes),
            lastErrorAt: null,
            lastErrorMessage: null,
          },
        },
      },
    },
  });
}

async function createGmailMailbox(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  email: string,
  grantedScopes: string[],
) {
  return prisma.mailAccount.create({
    data: {
      ownerEmployeeId,
      createdByEmployeeId: ownerEmployeeId,
      emailAddress: email,
      providerType: GMAIL_PROVIDER,
      status: 'ACTIVE',
      providerConnection: {
        create: gmailConnectionWrite(email, grantedScopes),
      },
    },
    select: { id: true },
  });
}
