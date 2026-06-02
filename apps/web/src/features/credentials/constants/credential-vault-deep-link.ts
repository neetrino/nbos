/** Query param to open a credential Sheet on the vault page. */
export const CREDENTIAL_VAULT_OPEN_QUERY = 'open';

export function buildCredentialVaultHref(credentialId: string): string {
  return `/credentials?${CREDENTIAL_VAULT_OPEN_QUERY}=${encodeURIComponent(credentialId)}`;
}
