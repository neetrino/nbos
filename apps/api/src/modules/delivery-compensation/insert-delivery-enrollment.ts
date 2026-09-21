import { ConflictException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { isPrismaUniqueConstraint } from './prisma-unique';

type Db = Pick<InstanceType<typeof PrismaClient>, 'deliveryConfiguration'>;

type EnrollmentTarget = { productId: string } | { extensionId: string };

/**
 * Creates the V2 configuration row and returns its id. Two enrollments of the same card race on the
 * unique index rather than on a read, so the loser of the race resolves to the row the winner
 * created instead of failing a user who did nothing wrong.
 */
export async function insertDeliveryEnrollment(
  db: Db,
  target: EnrollmentTarget,
  orderId: string,
): Promise<string> {
  const entityKind = 'productId' in target ? 'PRODUCT' : 'EXTENSION';
  try {
    const created = await db.deliveryConfiguration.create({
      data: { orderId, ...target, entityKind, mode: 'V2' },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (!isPrismaUniqueConstraint(error)) {
      throw error;
    }
    const existing = await db.deliveryConfiguration.findFirst({
      where: target,
      select: { id: true },
    });
    if (!existing) {
      throw new ConflictException('CONFIGURATION_CONFLICT');
    }
    return existing.id;
  }
}
