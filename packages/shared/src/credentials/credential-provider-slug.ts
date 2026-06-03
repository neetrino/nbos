/** Normalized slug for credential provider catalog (unique key). */
export function slugifyCredentialProviderName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const slug = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug.length > 0 ? slug : 'provider';
}
