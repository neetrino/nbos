import type { Prisma } from '@nbos/database';

export const FILE_ASSET_INCLUDE = {
  versions: { orderBy: { versionNumber: 'desc' as const } },
  links: { where: { unlinkedAt: null }, orderBy: { linkedAt: 'desc' as const } },
} satisfies Prisma.FileAssetInclude;
