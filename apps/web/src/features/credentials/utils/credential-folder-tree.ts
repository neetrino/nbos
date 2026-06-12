import type { CredentialFolder } from '@/lib/api/credentials';

export type CredentialFolderTreeNode = CredentialFolder & { children: CredentialFolderTreeNode[] };

export function buildCredentialFolderTree(folders: CredentialFolder[]): CredentialFolderTreeNode[] {
  const byParent = new Map<string | null, CredentialFolder[]>();
  for (const folder of folders) {
    const key = folder.parentId;
    const list = byParent.get(key) ?? [];
    list.push(folder);
    byParent.set(key, list);
  }

  const build = (parentId: string | null): CredentialFolderTreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => ({
        ...folder,
        children: build(folder.id),
      }));

  return build(null);
}

export function credentialFolderPathLabel(
  folders: CredentialFolder[],
  folderId: string | null,
): string {
  if (!folderId) return 'No folder';
  const path = buildCredentialFolderBreadcrumb(folders, folderId);
  return path.map((folder) => folder.name).join(' / ');
}

export function credentialFoldersAtLevel(
  folders: CredentialFolder[],
  parentId: string | null,
): CredentialFolder[] {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function credentialFolderChildCount(folders: CredentialFolder[], folderId: string): number {
  return folders.filter((folder) => folder.parentId === folderId).length;
}

export function buildCredentialFolderBreadcrumb(
  folders: CredentialFolder[],
  activeFolderId: string | null,
): CredentialFolder[] {
  if (!activeFolderId) return [];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: CredentialFolder[] = [];
  let current = byId.get(activeFolderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}
