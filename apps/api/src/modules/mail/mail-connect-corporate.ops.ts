import { ConflictException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE,
  assertNoOtherLiveMailbox,
  normalizeMailboxEmail,
  resolveMailboxForConnect,
} from './mail-account-uniqueness.ops';
import { isUniqueConstraintError } from './mail-unique-violation';

export const MAIL_NEEDS_RECONNECT_CODE = 'MAIL_NEEDS_RECONNECT';
export { normalizeMailboxEmail };

const CORPORATE_PROVIDER = 'CORPORATE_IMAP_SMTP';

export type CorporateMailboxSettings = {
  email: string;
  displayName?: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: string;
  login: string;
};

export async function findOwnedMailboxByEmail(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  emailAddress: string,
) {
  const resolved = await resolveMailboxForConnect(prisma, ownerEmployeeId, emailAddress);
  return resolved.kind === 'reuse' ? resolved.account : null;
}

function connectionWriteData(dto: CorporateMailboxSettings) {
  return {
    username: dto.login,
    imapHost: dto.imapHost,
    imapPort: dto.imapPort,
    secureMode: dto.imapSecure,
    smtpHost: dto.smtpHost,
    smtpPort: dto.smtpPort,
    smtpSecureMode: dto.smtpSecure,
  };
}

export async function upsertCorporateMailboxDraft(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  dto: CorporateMailboxSettings,
) {
  const email = normalizeMailboxEmail(dto.email);
  const existing = await findOwnedMailboxByEmail(prisma, ownerEmployeeId, email);
  const connection = connectionWriteData({ ...dto, email });
  if (existing) {
    return writeCorporateMailboxDraft(prisma, existing.id, dto);
  }
  try {
    return await createCorporateMailboxDraft(prisma, ownerEmployeeId, dto, email, connection);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

async function createCorporateMailboxDraft(
  prisma: InstanceType<typeof PrismaClient>,
  ownerEmployeeId: string,
  dto: CorporateMailboxSettings,
  email: string,
  connection: ReturnType<typeof connectionWriteData>,
) {
  return prisma.mailAccount.create({
    data: {
      ownerEmployeeId,
      createdByEmployeeId: ownerEmployeeId,
      emailAddress: email,
      displayName: dto.displayName ?? null,
      providerType: CORPORATE_PROVIDER,
      status: 'NEEDS_RECONNECT',
      providerConnection: {
        create: { providerType: CORPORATE_PROVIDER, status: 'NOT_CONNECTED', ...connection },
      },
    },
    include: { providerConnection: true },
  });
}

export async function writeCorporateMailboxDraft(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  dto: CorporateMailboxSettings,
) {
  const email = normalizeMailboxEmail(dto.email);
  await assertNoOtherLiveMailbox(prisma, email, mailAccountId);
  return prisma.mailAccount.update({
    where: { id: mailAccountId },
    data: {
      emailAddress: email,
      displayName: dto.displayName ?? undefined,
      providerType: CORPORATE_PROVIDER,
      status: 'NEEDS_RECONNECT',
      providerConnection: {
        update: {
          providerType: CORPORATE_PROVIDER,
          ...connectionWriteData({ ...dto, email }),
          status: 'NOT_CONNECTED',
        },
      },
    },
    include: { providerConnection: true },
  });
}

export async function promoteCorporateMailboxConnected(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
) {
  return prisma.mailAccount.update({
    where: { id: mailAccountId },
    data: {
      status: 'ACTIVE',
      lastErrorAt: null,
      providerConnection: {
        update: {
          status: 'CONNECTED',
          lastValidatedAt: new Date(),
          lastErrorAt: null,
          lastErrorMessage: null,
        },
      },
    },
    include: { providerConnection: true },
  });
}

export type StoredCorporateConnection = {
  username: string | null;
  imapHost: string | null;
  imapPort: number | null;
  secureMode: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecureMode: string | null;
};

export function resolveCorporateReconnectSettings(params: {
  account: { emailAddress: string; displayName: string | null };
  connection: StoredCorporateConnection | null;
  patch: Partial<CorporateMailboxSettings>;
}): CorporateMailboxSettings | { error: string } {
  const connection = params.connection;
  const email = normalizeMailboxEmail(params.patch.email ?? params.account.emailAddress);
  const imapHost = params.patch.imapHost ?? connection?.imapHost ?? '';
  const smtpHost = params.patch.smtpHost ?? connection?.smtpHost ?? '';
  const login = params.patch.login ?? connection?.username ?? '';
  const imapPort = params.patch.imapPort ?? connection?.imapPort ?? 0;
  const smtpPort = params.patch.smtpPort ?? connection?.smtpPort ?? 0;
  if (!email || !imapHost || !smtpHost || !login || imapPort < 1 || smtpPort < 1) {
    return { error: 'Mailbox settings are incomplete. Fill the missing fields and reconnect.' };
  }
  return {
    email,
    displayName: params.patch.displayName ?? params.account.displayName,
    imapHost,
    imapPort,
    imapSecure: params.patch.imapSecure ?? connection?.secureMode ?? 'SSL',
    smtpHost,
    smtpPort,
    smtpSecure: params.patch.smtpSecure ?? connection?.smtpSecureMode ?? 'SSL',
    login,
  };
}
