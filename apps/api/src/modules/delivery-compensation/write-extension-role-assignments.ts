import type { PrismaClient, TransactionClient } from '@nbos/database';
import { assertDeliveryOpenForExtension } from './assert-delivery-open';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';
import { lockDeliveryConfigurationForExtension } from './lock-delivery-configuration';
import {
  parseExtensionRoleAssignments,
  type ExtensionRoleAssignmentInput,
} from './extension-role-assignments';

/**
 * Persists extension role holders. Refuses once the plan is materialized: from that point
 * money already sits with named people, so a change is a replacement, not an assignment.
 * Plan state and extension status are re-read under the configuration lock, so a concurrent
 * first Development or Done cannot slip in between the check and the write.
 */
export async function writeExtensionRoleAssignments(
  prisma: InstanceType<typeof PrismaClient>,
  extensionId: string,
  assignments: readonly ExtensionRoleAssignmentInput[],
): Promise<void> {
  const parsed = parseExtensionRoleAssignments(assignments);
  await prisma.$transaction(async (tx) => {
    await lockDeliveryConfigurationForExtension(tx, extensionId);
    await assertPlanNotMaterialized(tx, extensionId);
    await assertDeliveryOpenForExtension(tx, extensionId);
    for (const assignment of parsed) {
      if (assignment.employeeId === null) {
        await tx.extensionDeliveryRoleAssignment.deleteMany({
          where: { extensionId, roleKey: assignment.roleKey },
        });
        continue;
      }
      await tx.extensionDeliveryRoleAssignment.upsert({
        where: { extensionId_roleKey: { extensionId, roleKey: assignment.roleKey } },
        create: { extensionId, roleKey: assignment.roleKey, employeeId: assignment.employeeId },
        update: { employeeId: assignment.employeeId },
      });
    }
  });
}

async function assertPlanNotMaterialized(
  tx: Pick<TransactionClient, 'deliveryConfiguration'>,
  extensionId: string,
): Promise<void> {
  const configuration = await tx.deliveryConfiguration.findFirst({
    where: { extensionId },
    select: { initialRevisionId: true },
  });
  if (configuration?.initialRevisionId) {
    throwDeliveryCompensationError('REDISTRIBUTION_REQUIRED');
  }
}
