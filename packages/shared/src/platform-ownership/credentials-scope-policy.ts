export function isCredentialsAllScopeMode(
  resourceFamily: string,
  scopeMode: string | null | undefined,
): boolean {
  return resourceFamily === 'CREDENTIALS' && scopeMode === 'ALL';
}
