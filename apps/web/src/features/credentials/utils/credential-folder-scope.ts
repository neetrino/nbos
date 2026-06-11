import type { CredentialFolder } from '@/lib/api/credentials';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export type CredentialFolderScope = 'MY' | 'TEAM' | 'PROJECT' | 'SECRET';

/** Maps credential access level to folder tree scope (vault sections). */
export function accessLevelToFolderScope(accessLevel: string): CredentialFolderScope | null {
  switch (accessLevel) {
    case 'PERSONAL':
      return 'MY';
    case 'DEPARTMENT':
      return 'TEAM';
    case 'PROJECT_TEAM':
      return 'PROJECT';
    case 'SECRET':
      return 'SECRET';
    default:
      return null;
  }
}

export function vaultScopeToFolderScope(
  vaultScope: CredentialVaultScope | undefined,
): CredentialFolderScope | null {
  switch (vaultScope) {
    case 'my':
      return 'MY';
    case 'team':
      return 'TEAM';
    case 'project':
      return 'PROJECT';
    case 'secret':
      return 'SECRET';
    default:
      return null;
  }
}

export interface CredentialFolderContext {
  isCreate: boolean;
  vaultScope?: CredentialVaultScope;
  accessLevel?: string;
  projectId?: string | null;
}

function resolveFolderScope(context: CredentialFolderContext): CredentialFolderScope | null {
  if (context.isCreate) {
    return vaultScopeToFolderScope(context.vaultScope);
  }
  return accessLevelToFolderScope(context.accessLevel ?? '');
}

/**
 * Folders in the sheet must match the credential section (My / Team / Project / Secret),
 * not the active vault tab — e.g. a Team credential opened from All shows Team folders only.
 */
export function filterCredentialFoldersForContext(
  folders: CredentialFolder[],
  context: CredentialFolderContext,
): CredentialFolder[] {
  const scope = resolveFolderScope(context);
  if (!scope) return [];

  let scoped = folders.filter((folder) => folder.scope === scope);

  if (scope === 'PROJECT' && context.projectId) {
    scoped = scoped.filter((folder) => folder.projectId === context.projectId);
  }

  return scoped.sort((a, b) => a.name.localeCompare(b.name));
}

export interface CredentialFolderMatchInput {
  accessLevel: string;
  projectId?: string | null;
}

/** Whether a credential may be placed in the given folder (same vault section). */
export function credentialMatchesFolder(
  credential: CredentialFolderMatchInput,
  folder: CredentialFolder,
): boolean {
  const expectedScope = accessLevelToFolderScope(credential.accessLevel);
  if (!expectedScope || folder.scope !== expectedScope) return false;
  if (
    expectedScope === 'PROJECT' &&
    credential.projectId &&
    folder.projectId !== credential.projectId
  ) {
    return false;
  }
  return true;
}

export function canMoveCredentialsToFolder(
  credentialIds: readonly string[],
  folder: CredentialFolder,
  lookup: (credentialId: string) => CredentialFolderMatchInput | null | undefined,
): boolean {
  if (credentialIds.length === 0) return false;
  return credentialIds.every((id) => {
    const credential = lookup(id);
    return credential ? credentialMatchesFolder(credential, folder) : false;
  });
}

export function filterFoldersForCredentials(
  folders: CredentialFolder[],
  credentials: readonly CredentialFolderMatchInput[],
): CredentialFolder[] {
  if (credentials.length === 0) return [];
  return folders
    .filter((folder) =>
      credentials.every((credential) => credentialMatchesFolder(credential, folder)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
