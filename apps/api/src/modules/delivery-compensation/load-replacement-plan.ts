import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { DeliveryCompensationRoleKey } from '@nbos/shared';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { serializeReplacementPlan, type ReplacementPlanDto } from './serialize-replacement-plan';

/** Components and current holders a replacement must redistribute for one role. */
export async function loadReplacementPlan(
  prisma: InstanceType<typeof PrismaClient>,
  configurationId: string,
  roleKey: DeliveryCompensationRoleKey,
): Promise<ReplacementPlanDto> {
  const configuration = await prisma.deliveryConfiguration.findUnique({
    where: { id: configurationId },
    select: {
      id: true,
      mode: true,
      currentRevision: { select: { sequence: true } },
      components: {
        where: { roleKey },
        orderBy: { componentKey: 'asc' },
        select: {
          id: true,
          componentKey: true,
          kind: true,
          allocations: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              employeeId: true,
              employee: { select: { firstName: true, lastName: true } },
              bonusEntry: { select: { bonusReleases: { select: { status: true } } } },
            },
          },
        },
      },
    },
  });
  if (!configuration) {
    throw new NotFoundException(`Delivery configuration ${configurationId} not found`);
  }
  if (configuration.mode !== 'V2') {
    throwDeliveryCompensationError('LEGACY_ADOPTION_REQUIRED');
  }
  return serializeReplacementPlan({
    configurationId: configuration.id,
    roleKey,
    expectedRevision: configuration.currentRevision?.sequence ?? null,
    components: configuration.components,
  });
}
