import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { parseOptionalEntityNotes } from '../parse-entity-notes';

export type UpdateOrderGeneralInput = {
  notes?: string | null;
};

export function parseUpdateOrderGeneralInput(body: UpdateOrderGeneralInput): {
  notes: string | null;
} {
  if (body.notes === undefined) {
    throw new BadRequestException('No fields to update');
  }
  return { notes: parseOptionalEntityNotes(body.notes) ?? null };
}

export async function applyOrderGeneralUpdate(
  prisma: PrismaClient,
  id: string,
  input: { notes: string | null },
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!order) {
    throw new NotFoundException(`Order ${id} not found`);
  }
  await prisma.order.update({
    where: { id },
    data: { notes: input.notes },
  });
}
