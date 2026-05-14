import { driveApi } from '@/lib/api/drive';

/** Safety caps when expanding folder selection into FileAsset ids (BFS). */
const DRIVE_FOLDER_EXPAND_MAX_FOLDERS = 120;
const DRIVE_FOLDER_EXPAND_MAX_FILES = 800;

/**
 * Lists all FileAsset ids under `rootFolderId` (recursive), using the same folder API as the UI.
 */
export async function collectFileAssetIdsInFolderSubtree(
  space: 'COMPANY' | 'PERSONAL',
  rootFolderId: string,
): Promise<string[]> {
  const out: string[] = [];
  const seenFile = new Set<string>();
  const queue: string[] = [rootFolderId];
  let visitedFolders = 0;

  while (
    queue.length > 0 &&
    visitedFolders < DRIVE_FOLDER_EXPAND_MAX_FOLDERS &&
    seenFile.size < DRIVE_FOLDER_EXPAND_MAX_FILES
  ) {
    const folderId = queue.shift()!;
    visitedFolders += 1;
    const listing = await driveApi.listFolder({ space, parentId: folderId });
    for (const file of listing.files) {
      if (seenFile.size >= DRIVE_FOLDER_EXPAND_MAX_FILES) break;
      if (!seenFile.has(file.id)) {
        seenFile.add(file.id);
        out.push(file.id);
      }
    }
    for (const sub of listing.folders) {
      if (visitedFolders + queue.length < DRIVE_FOLDER_EXPAND_MAX_FOLDERS) {
        queue.push(sub.id);
      }
    }
  }
  return out;
}
