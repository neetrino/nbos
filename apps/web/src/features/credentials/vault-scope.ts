/** Vault scope tabs (UX); maps to API `tab` query and create `accessLevel`. */
export type CredentialVaultScope = 'all' | 'my' | 'team' | 'project' | 'secret';

export function vaultScopeToListTab(scope: CredentialVaultScope): string {
  return scope;
}

export function accessLevelForVaultScope(scope: CredentialVaultScope): string | null {
  switch (scope) {
    case 'my':
      return 'PERSONAL';
    case 'team':
      return 'DEPARTMENT';
    case 'project':
      return 'PROJECT_TEAM';
    case 'secret':
      return 'SECRET';
    default:
      return null;
  }
}

export function canCreateInVaultScope(scope: CredentialVaultScope): boolean {
  return scope !== 'all';
}
