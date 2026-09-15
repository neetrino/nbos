import type { PrismaClient } from '@nbos/database';
import { getMissingRequiredAccessSlotsForDone } from '@nbos/shared';

export async function loadMissingRequiredAccessSlotKeys(
  prisma: InstanceType<typeof PrismaClient>,
  product: { id: string; productCategory: string; productType: string },
): Promise<string[]> {
  const bindings = await prisma.productAccessSlotBinding.findMany({
    where: { productId: product.id },
    select: { slotKey: true },
  });
  return getMissingRequiredAccessSlotsForDone({
    productCategory: product.productCategory,
    productType: product.productType,
    boundSlotKeys: [...new Set(bindings.map((row) => row.slotKey))],
  });
}
