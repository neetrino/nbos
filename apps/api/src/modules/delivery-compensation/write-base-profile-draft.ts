import { BadRequestException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import {
  coreProfileKeyForProductType,
  frozenDeliveryAxes,
  type BaseProfileWriteInput,
} from '@nbos/shared';
import type { BaseProfileRecord } from './serialize-norm-version';

const BASE_PROFILE_INCLUDE = {
  roleUnits: { orderBy: { roleKey: 'asc' as const } },
  includedFunctions: { select: { functionId: true } },
};

type StoredCore = {
  id: string;
  profileKey: string;
  version: number;
  status: string;
  productCategory: BaseProfileWriteInput['productCategory'];
};

/**
 * One product kind has one core. An open draft is updated in place.
 * Otherwise the next version keeps the profile key already used for that kind.
 */
export async function writeOpenBaseProfileDraft(
  tx: TransactionClient,
  input: BaseProfileWriteInput,
): Promise<BaseProfileRecord> {
  const existing = await listCores(tx, input.productType);
  const draft = existing.find((row) => row.status === 'DRAFT');
  if (draft) {
    return replaceDraftVector(tx, draft.id, input);
  }
  return createNextVersion(tx, existing[0] ?? null, input);
}

export async function replaceDraftVector(
  tx: TransactionClient,
  id: string,
  input: Pick<BaseProfileWriteInput, 'roleUnits' | 'includedFunctionIds'>,
): Promise<BaseProfileRecord> {
  await assertDraftStillOpen(tx, id);
  await tx.deliveryBaseProfileRoleUnit.deleteMany({ where: { baseProfileVersionId: id } });
  await tx.deliveryBaseIncludedFunction.deleteMany({ where: { baseProfileVersionId: id } });
  return tx.deliveryBaseProfileVersion.update({
    where: { id },
    data: {
      roleUnits: { create: input.roleUnits },
      includedFunctions: {
        create: input.includedFunctionIds.map((functionId) => ({ functionId })),
      },
    },
    include: BASE_PROFILE_INCLUDE,
  });
}

async function assertDraftStillOpen(tx: TransactionClient, id: string): Promise<void> {
  const claimed = await tx.deliveryBaseProfileVersion.updateMany({
    where: { id, status: 'DRAFT' },
    data: { status: 'DRAFT' },
  });
  if (claimed.count !== 1) {
    throw new BadRequestException('Only a draft base profile can be updated.');
  }
}

async function listCores(
  tx: TransactionClient,
  productType: BaseProfileWriteInput['productType'],
): Promise<StoredCore[]> {
  return tx.deliveryBaseProfileVersion.findMany({
    where: { productType },
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      profileKey: true,
      version: true,
      status: true,
      productCategory: true,
    },
  });
}

async function createNextVersion(
  tx: TransactionClient,
  previous: StoredCore | null,
  input: BaseProfileWriteInput,
): Promise<BaseProfileRecord> {
  const axes = frozenDeliveryAxes();
  return tx.deliveryBaseProfileVersion.create({
    data: {
      profileKey: previous?.profileKey ?? coreProfileKeyForProductType(input.productType),
      version: (previous?.version ?? 0) + 1,
      productType: input.productType,
      productCategory: previous?.productCategory ?? input.productCategory,
      implementationBase: axes.implementationBase,
      designMode: axes.designMode,
      aiDesignerReview: axes.aiDesignerReview,
      description: input.description,
      status: 'DRAFT',
      effectiveFrom: new Date(input.effectiveFrom),
      roleUnits: { create: input.roleUnits },
      includedFunctions: {
        create: input.includedFunctionIds.map((functionId) => ({ functionId })),
      },
    },
    include: BASE_PROFILE_INCLUDE,
  });
}
