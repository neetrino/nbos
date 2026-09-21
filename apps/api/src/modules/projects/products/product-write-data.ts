import { BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ProductCategoryEnum,
  type ProductTypeEnum,
} from '@nbos/database';
import { assertTeamPatchAllowedAfterPlan } from '../../delivery-compensation/assert-team-patch-after-plan';
import { lockProductDeveloperSlots } from './product-developer-slot-lock';
import { assertProductDeveloperSlotsForUpdate } from './product-developer-slots';
import { resolveProductPlatform } from './resolve-product-platform';

export interface CreateProductDto {
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  productPlatform?: string | null;
  pmId?: string;
  deadline?: string;
  description?: string;
  checklistTemplateId?: string;
  languages?: string[];
  contactIds?: string[];
  companyId?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  productCategory?: string;
  productType?: string;
  productPlatform?: string | null;
  pmId?: string | null;
  developerId?: string | null;
  frontendDeveloperId?: string | null;
  designerId?: string | null;
  technicalSpecialistId?: string | null;
  sellerId?: string | null;
  qaLeadId?: string | null;
  deadline?: string | null;
  description?: string | null;
  checklistTemplateId?: string | null;
  languages?: string[];
  contactIds?: string[];
  companyId?: string | null;
}

/** Allowed ISO-like language codes for `Product.languages` (lowercase). */
export function normalizeProductLanguages(input: unknown): string[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) {
    throw new BadRequestException('languages must be an array of strings');
  }
  const out = new Set<string>();
  for (const v of input) {
    if (typeof v !== 'string') continue;
    const s = v.trim().toLowerCase();
    if (s.length < 2 || s.length > 12) continue;
    if (/^[a-z]{2}(-[a-z]{2})?$/.test(s)) out.add(s);
  }
  return Array.from(out);
}

export function buildProductUpdateData(data: UpdateProductDto): Prisma.ProductUpdateInput {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.pmId !== undefined && { pmId: data.pmId }),
    ...(data.developerId !== undefined && { developerId: data.developerId }),
    ...(data.frontendDeveloperId !== undefined && {
      frontendDeveloperId: data.frontendDeveloperId,
    }),
    ...(data.designerId !== undefined && { designerId: data.designerId }),
    ...(data.technicalSpecialistId !== undefined && {
      technicalSpecialistId: data.technicalSpecialistId,
    }),
    ...(data.sellerId !== undefined && { sellerId: data.sellerId }),
    ...(data.qaLeadId !== undefined && { qaLeadId: data.qaLeadId }),
    ...(data.deadline !== undefined && {
      deadline: data.deadline ? new Date(data.deadline) : null,
    }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.checklistTemplateId !== undefined && {
      checklistTemplateId: data.checklistTemplateId,
    }),
    ...(data.languages !== undefined && {
      languages: normalizeProductLanguages(data.languages),
    }),
    ...(data.companyId !== undefined && {
      company: data.companyId ? { connect: { id: data.companyId } } : { disconnect: true },
    }),
  };
}

export function buildProductTaxonomyPatch(
  data: UpdateProductDto,
  current: { productCategory: string; productType: string; productPlatform: string | null },
): Prisma.ProductUpdateInput {
  if (
    data.productCategory === undefined &&
    data.productType === undefined &&
    data.productPlatform === undefined
  ) {
    return {};
  }
  const productCategory = data.productCategory ?? current.productCategory;
  const productType = data.productType ?? current.productType;
  return {
    productCategory: productCategory as ProductCategoryEnum,
    productType: productType as ProductTypeEnum,
    productPlatform: resolveProductPlatform({
      productCategory,
      productType,
      requested:
        data.productPlatform !== undefined ? data.productPlatform : current.productPlatform,
    }),
  };
}

export async function writeProductUpdate(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  data: UpdateProductDto,
  primaryContactId?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const current = await lockProductDeveloperSlots(tx, id);
    assertProductDeveloperSlotsForUpdate(current, data);
    await assertTeamPatchAllowedAfterPlan(tx, id, data);
    const taxonomy = await tx.product.findUniqueOrThrow({
      where: { id },
      select: { productCategory: true, productType: true, productPlatform: true },
    });
    await tx.product.update({
      where: { id },
      data: {
        ...buildProductUpdateData(data),
        ...buildProductTaxonomyPatch(data, taxonomy),
        ...(primaryContactId ? { contact: { connect: { id: primaryContactId } } } : {}),
      },
    });
  });
}
