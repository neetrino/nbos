import type { CredentialFolder } from '@/lib/api/credentials';

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
