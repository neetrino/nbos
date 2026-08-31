import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function requireTicketEntityAccess(
  prisma: PrismaLike,
  ticketId: string,
): Promise<{ id: string }> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) throw new NotFoundException('Ticket not found');
  return ticket;
}
