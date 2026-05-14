import type { DriveFolder } from '@/lib/api/drive';

/** Max folder name length — aligned with API validation. */
export const DRIVE_FOLDER_NAME_MAX_LENGTH = 180;

export type FolderTreeNode = DriveFolder & { children: FolderTreeNode[] };

export function buildFolderTree(folders: DriveFolder[]): FolderTreeNode[] {
  const byParent = new Map<string | null, DriveFolder[]>();
  for (const folder of folders) {
    const key = folder.parentId;
    const list = byParent.get(key) ?? [];
    list.push(folder);
    byParent.set(key, list);
  }
  const build = (parentId: string | null): FolderTreeNode[] =>
    (byParent.get(parentId) ?? []).map((folder) => ({
      ...folder,
      children: build(folder.id),
    }));
  return build(null);
}
