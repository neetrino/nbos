import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

/**
 * Blocks selecting Paused/Terminated partners for new inbound CRM attribution
 * unless the actor is CEO or Platform Owner.
 */
export async function assertPartnerAssignableForInboundCrm(
  prisma: InstanceType<typeof PrismaClient>,
  source: string | null | undefined,
  partnerId: string | null | undefined,
  canOverridePausedPartner: boolean,
): Promise<void> {
  if (source !== 'PARTNER' || !partnerId?.trim()) return;

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, status: true },
  });
  if (!partner) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'PARTNER_NOT_FOUND',
      message: `Partner ${partnerId} was not found.`,
      errors: [{ field: 'sourcePartnerId', message: 'Unknown partner id' }],
    });
  }

  if (partner.status === 'ACTIVE') return;
  if (canOverridePausedPartner) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'PARTNER_NOT_AVAILABLE',
    message: `Partner "${partner.name}" is ${partner.status} and cannot be used for new Partner-sourced CRM records without leadership approval.`,
    errors: [
      {
        field: 'sourcePartnerId',
        message:
          'Partner must be Active, or retry with a CEO or platform-owner account to override Paused/Terminated partners.',
      },
    ],
  });
}
