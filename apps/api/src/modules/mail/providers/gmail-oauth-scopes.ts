/** Gmail OAuth scopes required for NBOS mail (read/sync, modify labels, send). */
export const GMAIL_MODIFY_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

export const GMAIL_SCOPES = [
  GMAIL_MODIFY_SCOPE,
  'https://www.googleapis.com/auth/gmail.send',
] as const;

export function parseOAuthGrantedScopes(
  scopeHeader: string | undefined,
  fallback: readonly string[],
): string[] {
  if (!scopeHeader?.trim()) {
    return [...fallback];
  }
  return scopeHeader.trim().split(/\s+/);
}

export function hasGmailModifyScope(scopes: readonly string[]): boolean {
  return scopes.some((scope) => scope === GMAIL_MODIFY_SCOPE || scope.endsWith('/gmail.modify'));
}

export function isGmailInsufficientScopeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('insufficient authentication scopes') ||
    message.includes('Insufficient Permission')
  );
}
