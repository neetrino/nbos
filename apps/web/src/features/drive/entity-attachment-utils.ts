import type { FileAsset, FileLink } from '@/lib/api/drive';

export function findEntityFileLink(
  file: FileAsset,
  entityType: string,
  entityId: string,
): FileLink | undefined {
  return file.links.find(
    (link) =>
      link.entityType === entityType && link.entityId === entityId && link.unlinkedAt == null,
  );
}
