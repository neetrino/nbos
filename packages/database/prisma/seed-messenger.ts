import type { PrismaClient } from '../src/generated/prisma/client';

type SeedEmp = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function employeeDisplay(e: SeedEmp): string {
  const n = `${e.firstName} ${e.lastName}`.trim();
  return n.length > 0 ? n : e.email;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function seedMessenger(
  prisma: PrismaClient,
  emps: {
    ceo: SeedEmp;
    seller: SeedEmp;
    pm: SeedEmp;
    pm2: SeedEmp;
    dev: SeedEmp;
    designer: SeedEmp;
  },
): Promise<void> {
  const { ceo, seller, pm, pm2, dev, designer } = emps;

  await prisma.messengerDirectMessage.deleteMany();
  await prisma.messengerDirectThread.deleteMany();
  await prisma.messengerChannelMessage.deleteMany();
  await prisma.messengerChannel.deleteMany();

  const chGeneral = await prisma.messengerChannel.create({
    data: { name: '#general', projectId: 'system', type: 'GENERAL' },
  });
  await prisma.messengerChannel.create({
    data: { name: '#project-nbos', projectId: 'nbos', type: 'PROJECT' },
  });
  await prisma.messengerChannel.create({
    data: { name: '#announcements', projectId: 'system', type: 'ANNOUNCEMENT' },
  });

  const seedLines: { sender: SeedEmp; text: string; at: Date }[] = [
    {
      sender: ceo,
      text: 'Good morning everyone! Ready for the standup?',
      at: new Date('2026-03-10T09:00:00.000Z'),
    },
    {
      sender: seller,
      text: 'Morning! Let me grab my coffee first.',
      at: new Date('2026-03-10T09:02:00.000Z'),
    },
    {
      sender: pm,
      text: 'I pushed the auth module changes. Can someone review?',
      at: new Date('2026-03-10T09:15:00.000Z'),
    },
    {
      sender: pm2,
      text: "I'll take a look at the PR after lunch.",
      at: new Date('2026-03-10T09:20:00.000Z'),
    },
    {
      sender: ceo,
      text: "Great teamwork! Don't forget the retro at 3pm.",
      at: new Date('2026-03-10T09:25:00.000Z'),
    },
    {
      sender: designer,
      text: 'Posted updated messenger wireframes in Drive.',
      at: new Date('2026-03-10T10:00:00.000Z'),
    },
  ];

  for (const row of seedLines) {
    await prisma.messengerChannelMessage.create({
      data: {
        channelId: chGeneral.id,
        senderId: row.sender.id,
        senderNameSnapshot: employeeDisplay(row.sender),
        content: row.text,
        createdAt: row.at,
      },
    });
  }

  const [ceoSellerA, ceoSellerB] = sortPair(ceo.id, seller.id);
  const dmCeoSeller = await prisma.messengerDirectThread.create({
    data: { participantAId: ceoSellerA, participantBId: ceoSellerB },
  });
  await prisma.messengerDirectMessage.create({
    data: {
      threadId: dmCeoSeller.id,
      senderId: seller.id,
      senderNameSnapshot: employeeDisplay(seller),
      content: 'Quick question on the NBOS roadmap when you have a minute.',
      createdAt: new Date('2026-03-11T14:00:00.000Z'),
    },
  });

  const [pmDevA, pmDevB] = sortPair(pm.id, dev.id);
  const dmPmDev = await prisma.messengerDirectThread.create({
    data: { participantAId: pmDevA, participantBId: pmDevB },
  });
  await prisma.messengerDirectMessage.create({
    data: {
      threadId: dmPmDev.id,
      senderId: dev.id,
      senderNameSnapshot: employeeDisplay(dev),
      content: 'Deployed the messenger DB slice to staging.',
      createdAt: new Date('2026-03-11T15:30:00.000Z'),
    },
  });
}
