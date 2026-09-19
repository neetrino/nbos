import type { TransactionClient } from '@nbos/database';
import type { DeliveryCompensationRoleKey } from '@nbos/shared';

const PRODUCT_SLOT: Record<DeliveryCompensationRoleKey, string> = {
  BACKEND: 'developerId',
  FRONTEND: 'frontendDeveloperId',
  PM: 'pmId',
  DESIGNER: 'designerId',
  QA: 'qaLeadId',
  TECHNICAL_SPECIALIST: 'technicalSpecialistId',
};

export async function syncReplacementAssignee(
  db: TransactionClient,
  input: {
    productId: string | null;
    extensionId: string | null;
    roleKey: DeliveryCompensationRoleKey;
    toEmployeeId: string;
  },
): Promise<void> {
  if (input.productId) {
    await db.product.update({
      where: { id: input.productId },
      data: { [PRODUCT_SLOT[input.roleKey]]: input.toEmployeeId },
    });
    return;
  }
  if (!input.extensionId) {
    return;
  }
  await db.extensionDeliveryRoleAssignment.upsert({
    where: { extensionId_roleKey: { extensionId: input.extensionId, roleKey: input.roleKey } },
    create: {
      extensionId: input.extensionId,
      roleKey: input.roleKey,
      employeeId: input.toEmployeeId,
    },
    update: { employeeId: input.toEmployeeId },
  });
}
