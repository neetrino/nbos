import type { TransactionClient } from '@nbos/database';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

const TEAM_FIELDS = [
  'pmId',
  'developerId',
  'frontendDeveloperId',
  'designerId',
  'qaLeadId',
  'technicalSpecialistId',
] as const;

export async function assertTeamPatchAllowedAfterPlan(
  db: TransactionClient,
  productId: string,
  patch: Partial<Record<(typeof TEAM_FIELDS)[number], string | null | undefined>>,
): Promise<void> {
  const planned = await db.deliveryConfiguration.findFirst({
    where: { productId, mode: 'V2', initialRevisionId: { not: null } },
    select: { id: true },
  });
  if (!planned) {
    return;
  }
  const current = await db.product.findUnique({
    where: { id: productId },
    select: {
      pmId: true,
      developerId: true,
      frontendDeveloperId: true,
      designerId: true,
      qaLeadId: true,
      technicalSpecialistId: true,
    },
  });
  if (!current) {
    return;
  }
  const changed = TEAM_FIELDS.some(
    (field) => patch[field] !== undefined && patch[field] !== current[field],
  );
  if (changed) {
    throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
  }
}
