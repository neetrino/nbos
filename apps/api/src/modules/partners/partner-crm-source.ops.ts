import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

/** Same privilege floor as Deal Won override (Owner / CEO style roles). */
const PARTNER_SOURCE_OVERRIDE_ROLE_LEVEL = 2;

/**
 * Blocks selecting Paused/Terminated partners for new inbound CRM attribution
 * unless the actor has sufficient role level (NBOS Partner Directory §4).
 */
export async function assertPartnerAssignableForInboundCrm(
  prisma: InstanceType<typeof PrismaClient>,
  source: string | null | undefined,
  partnerId: string | null | undefined,
  actorRoleLevel: number | undefined,
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

  const privileged =
    actorRoleLevel !== undefined && actorRoleLevel <= PARTNER_SOURCE_OVERRIDE_ROLE_LEVEL;
  if (privileged) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'PARTNER_NOT_AVAILABLE',
    message: `Partner "${partner.name}" is ${partner.status} and cannot be used for new Partner-sourced CRM records without leadership approval.`,
    errors: [
      {
        field: 'sourcePartnerId',
        message:
          'Partner must be Active, or retry with an Owner/CEO-level account to override Paused/Terminated partners.',
      },
    ],
  });
}
