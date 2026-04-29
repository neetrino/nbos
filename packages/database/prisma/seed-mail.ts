import type { PrismaClient } from '../src/generated/prisma/client';

type SeedEmp = { id: string; email: string };

export async function seedMail(prisma: PrismaClient, emps: { ceo: SeedEmp }): Promise<void> {
  const { ceo } = emps;

  await prisma.emailRecipient.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.emailThread.deleteMany();
  await prisma.mailAccount.deleteMany();

  const account = await prisma.mailAccount.create({
    data: {
      ownerEmployeeId: ceo.id,
      createdByEmployeeId: ceo.id,
      emailAddress: 'suren@neetrino.com',
      displayName: 'Suren Babajanyan (work)',
      providerType: 'CORPORATE_IMAP_SMTP',
      status: 'PAUSED',
      lastSyncAt: new Date('2026-04-28T12:00:00.000Z'),
    },
  });

  const thread = await prisma.emailThread.create({
    data: {
      mailAccountId: account.id,
      subjectNormalized: 'project nbos — kickoff',
      lastMessageAt: new Date('2026-04-27T15:30:00.000Z'),
      lastInboundAt: new Date('2026-04-27T14:00:00.000Z'),
      lastOutboundAt: new Date('2026-04-27T15:30:00.000Z'),
      hasUnread: true,
      needsBusinessLink: true,
    },
  });

  const inbound = await prisma.emailMessage.create({
    data: {
      threadId: thread.id,
      mailAccountId: account.id,
      providerMessageId: 'seed-inbound-1',
      messageIdHeader: '<seed-inbound-1@nbos.local>',
      direction: 'INBOUND',
      subject: 'Re: Project NBOS — kickoff',
      bodyText: 'Hi Suren, can we confirm the kickoff agenda for Thursday?',
      sentAt: new Date('2026-04-27T14:00:00.000Z'),
      receivedAt: new Date('2026-04-27T14:02:00.000Z'),
      readState: 'READ',
    },
  });

  await prisma.emailRecipient.createMany({
    data: [
      {
        messageId: inbound.id,
        kind: 'FROM',
        email: 'client@example.com',
        displayName: 'Client Contact',
      },
      {
        messageId: inbound.id,
        kind: 'TO',
        email: account.emailAddress,
        displayName: account.displayName,
      },
    ],
  });

  const outbound = await prisma.emailMessage.create({
    data: {
      threadId: thread.id,
      mailAccountId: account.id,
      providerMessageId: 'seed-outbound-1',
      messageIdHeader: '<seed-outbound-1@nbos.local>',
      direction: 'OUTBOUND',
      subject: 'Re: Project NBOS — kickoff',
      bodyText: 'Thursday works. I will share the agenda doc before EOD.',
      sentAt: new Date('2026-04-27T15:30:00.000Z'),
      receivedAt: new Date('2026-04-27T15:30:00.000Z'),
      readState: 'UNREAD',
    },
  });

  await prisma.emailRecipient.createMany({
    data: [
      {
        messageId: outbound.id,
        kind: 'FROM',
        email: account.emailAddress,
        displayName: account.displayName,
      },
      {
        messageId: outbound.id,
        kind: 'TO',
        email: 'client@example.com',
        displayName: 'Client Contact',
      },
    ],
  });
}
