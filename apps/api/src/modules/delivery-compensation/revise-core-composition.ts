import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import {
  decimalToNullableString,
  frozenDeliveryAxes,
  isProductTypeOfferedForNewProduct,
  PRODUCT_CATEGORIES,
  salePriceTargetKey,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  DELIVERY_ROLE_UNIT_KINDS,
  type BaseProfileWriteInput,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleUnitKind,
  type ProductCategoryKey,
  type ProductTypeKey,
} from '@nbos/shared';
import { writeOpenBaseProfileDraft } from './write-base-profile-draft';

const ROLE_KEYS = new Set<string>(DELIVERY_COMPENSATION_ROLE_KEYS);
const UNIT_KINDS = new Set<string>(DELIVERY_ROLE_UNIT_KINDS);
const CATEGORIES = new Set<string>(PRODUCT_CATEGORIES);

type VersionHead = { id: string; status: string; productType: string | null };

/**
 * A published core stays frozen. Composition edits land on the open draft, or open the next
 * version of the same kind and carry the role vector and the published sale price with them.
 */
export async function resolveCoreItemsVersionId(
  tx: TransactionClient,
  profileVersionId: string,
): Promise<string> {
  const version = await tx.deliveryBaseProfileVersion.findUnique({
    where: { id: profileVersionId },
    select: { id: true, status: true, productType: true },
  });
  if (!version) {
    throw new NotFoundException(`Base profile version ${profileVersionId} not found`);
  }
  if (version.status === 'DRAFT') return version.id;
  if (version.status !== 'PUBLISHED') {
    throw new BadRequestException('Only a draft or the published core can be revised.');
  }
  return openDraftOrFork(tx, version);
}

async function openDraftOrFork(tx: TransactionClient, version: VersionHead): Promise<string> {
  const productType = offeredProductType(version.productType);
  const open = await tx.deliveryBaseProfileVersion.findFirst({
    where: { productType, status: 'DRAFT' },
    select: { id: true },
  });
  if (open) return open.id;
  const created = await forkPublishedCore(tx, version.id);
  await copyPublishedCorePrice(tx, version.id, created.id);
  return created.id;
}

async function forkPublishedCore(tx: TransactionClient, publishedId: string) {
  const source = await tx.deliveryBaseProfileVersion.findUnique({
    where: { id: publishedId },
    include: {
      roleUnits: true,
      includedFunctions: { select: { functionId: true } },
    },
  });
  if (!source) {
    throw new NotFoundException(`Base profile version ${publishedId} not found`);
  }
  return writeOpenBaseProfileDraft(tx, profileWriteFromPublished(source));
}

function profileWriteFromPublished(source: PublishedCore): BaseProfileWriteInput {
  return {
    ...frozenDeliveryAxes(),
    productType: offeredProductType(source.productType),
    productCategory: asCategory(source.productCategory),
    description: source.description,
    effectiveFrom: source.effectiveFrom.toISOString(),
    roleUnits: source.roleUnits.map(asRoleUnit),
    includedFunctionIds: source.includedFunctions.map((row) => row.functionId),
  };
}

async function copyPublishedCorePrice(
  tx: TransactionClient,
  fromId: string,
  toId: string,
): Promise<void> {
  const price = await tx.deliverySalePriceVersion.findFirst({
    where: { baseProfileVersionId: fromId, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });
  if (!price) return;
  await tx.deliverySalePriceVersion.create({
    data: {
      targetKey: salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: toId }),
      baseProfileVersionId: toId,
      version: 1,
      status: 'PUBLISHED',
      effectiveFrom: price.effectiveFrom,
      amountPerUnit: price.amountPerUnit,
      currency: price.currency,
      publishedAt: price.publishedAt,
      publishedById: price.publishedById,
    },
  });
}

type PublishedCore = {
  productType: string | null;
  productCategory: string | null;
  description: string | null;
  effectiveFrom: Date;
  roleUnits: Array<{ roleKey: string; unitKind: string; units: { toString(): string } | null }>;
  includedFunctions: Array<{ functionId: string }>;
};

function offeredProductType(value: string | null): ProductTypeKey {
  if (value !== null && isProductTypeOfferedForNewProduct(value)) {
    return value as ProductTypeKey;
  }
  throw new BadRequestException('This core kind cannot be revised.');
}

function asCategory(value: string | null): ProductCategoryKey | null {
  if (value === null) return null;
  if (CATEGORIES.has(value)) return value as ProductCategoryKey;
  throw new BadRequestException('Stored product category cannot be copied.');
}

function asRoleUnit(row: {
  roleKey: string;
  unitKind: string;
  units: { toString(): string } | null;
}): BaseProfileWriteInput['roleUnits'][number] {
  if (!ROLE_KEYS.has(row.roleKey) || !UNIT_KINDS.has(row.unitKind)) {
    throw new BadRequestException('Stored role vector cannot be copied.');
  }
  return {
    roleKey: row.roleKey as DeliveryCompensationRoleKey,
    unitKind: row.unitKind as DeliveryRoleUnitKind,
    units: decimalToNullableString(row.units),
  };
}
