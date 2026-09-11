import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

/** Product implies its Project so Client Messenger can create a Ticket from a Product link. */
export async function resolveSupportTicketProjectId(
  prisma: PrismaLike,
  productId: string | null | undefined,
  projectId: string | null | undefined,
): Promise<string | null> {
  const explicit = projectId?.trim() || null;
  if (explicit) return explicit;
  if (!productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { projectId: true },
  });
  if (!product) throw new NotFoundException(`Product ${productId} not found`);
  return product.projectId;
}
