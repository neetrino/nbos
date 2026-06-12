import { driveApi, type FileAsset } from '@/lib/api/drive';
import { findEntityFileLink } from './entity-attachment-utils';

/** Removes the entity link only; the file asset stays in its Drive folder. */
export async function unlinkFileFromEntityRecord(
  file: FileAsset,
  entityType: string,
  entityId: string,
): Promise<void> {
  const link = findEntityFileLink(file, entityType, entityId);
  if (!link) {
    throw new Error('File is not linked to this record.');
  }
  await driveApi.unlinkFileAsset(file.id, link.id);
}

/** Moves the file to Trash in Drive and soft-unlinks it from the entity when linked. */
export async function moveToTrashAndUnlinkFileFromEntityRecord(
  file: FileAsset,
  entityType: string,
  entityId: string,
): Promise<void> {
  const link = findEntityFileLink(file, entityType, entityId);
  if (link) {
    await driveApi.unlinkFileAsset(file.id, link.id);
  }
  await driveApi.moveFileToTrash(file.id);
}
