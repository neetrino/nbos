/** Query param to open a credential sheet on the vault list (same pattern as CRM `openLeadId`). */
export const CREDENTIAL_VAULT_OPEN_QUERY = 'openCredentialId';

export function buildCredentialVaultHref(credentialId: string): string {
  return `/credentials?${CREDENTIAL_VAULT_OPEN_QUERY}=${encodeURIComponent(credentialId)}`;
}
