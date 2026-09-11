import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function assertCoreFileAssetsExist(
  prisma: PrismaLike,
  fileAssetIds: string[],
): Promise<string[]> {
  const uniqueIds = [...new Set(fileAssetIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const found = await prisma.fileAsset.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  if (found.length !== uniqueIds.length) {
    throw new BadRequestException('Attachment must reference an existing Drive FileAsset');
  }
  return uniqueIds;
}
