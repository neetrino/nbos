import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

/**
 * Resolves Subscription.productId / projectId pair.
 * projectId must match Product.projectId when both are provided.
 */
export async function resolveSubscriptionProductOwnership(
  prisma: InstanceType<typeof PrismaClient>,
  input: { productId: string; projectId?: string },
): Promise<{ productId: string; projectId: string }> {
  const productId = input.productId?.trim();
  if (!productId) {
    throw new BadRequestException('productId is required');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, projectId: true },
  });
  if (!product) {
    throw new BadRequestException(`Product ${productId} not found`);
  }

  const projectId = input.projectId?.trim();
  if (projectId && projectId !== product.projectId) {
    throw new BadRequestException('projectId must match Product.projectId');
  }

  return { productId: product.id, projectId: product.projectId };
}
