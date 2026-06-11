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
