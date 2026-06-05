import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

export interface SupportTechnicalLinkInput {
  projectId: string | null;
  productId: string | null;
  technicalAssetId: string | null | undefined;
  technicalEnvironmentId: string | null | undefined;
}

/**
 * Ensures optional technical links belong to the ticket's project and (when set) product.
 * Product context is required whenever an asset or environment is linked.
 */
export async function assertSupportTechnicalLinksValid(
  prisma: InstanceType<typeof PrismaClient>,
  input: SupportTechnicalLinkInput,
): Promise<void> {
  const assetId = input.technicalAssetId;
  const envId = input.technicalEnvironmentId;

  const hasAsset = assetId !== undefined && assetId !== null;
  const hasEnv = envId !== undefined && envId !== null;

  if (!hasAsset && !hasEnv) return;

  if (!input.projectId) {
    throw new BadRequestException(
      'Project context is required to link a technical asset or environment.',
    );
  }

  if (!input.productId) {
    throw new BadRequestException(
      'Product context is required to link a technical asset or environment.',
    );
  }

  if (hasAsset) {
    const asset = await prisma.technicalAsset.findFirst({
      where: { id: assetId, projectId: input.projectId },
      select: { id: true, productId: true },
    });
    if (!asset) {
      throw new NotFoundException('Technical asset not found for this project.');
    }
    if (asset.productId !== input.productId) {
      throw new BadRequestException(
        'Technical asset must belong to the same product as the support ticket.',
      );
    }
  }

  if (hasEnv) {
    const env = await prisma.technicalEnvironment.findFirst({
      where: { id: envId, projectId: input.projectId },
      select: { id: true, productId: true },
    });
    if (!env) {
      throw new NotFoundException('Technical environment not found for this project.');
    }
    if (env.productId !== input.productId) {
      throw new BadRequestException(
        'Technical environment must belong to the same product as the support ticket.',
      );
    }
  }
}
