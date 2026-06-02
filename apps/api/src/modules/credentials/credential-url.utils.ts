const ALLOWED_CREDENTIAL_URL_PROTOCOLS = new Set(['http:', 'https:']);

export function isSafeCredentialOpenUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_CREDENTIAL_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}
