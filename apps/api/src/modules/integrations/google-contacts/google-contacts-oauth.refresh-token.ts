/**
 * Resolves the refresh token after Google OAuth.
 * Never reuse a prior token when the org Google account email changed.
 */
export function resolveGoogleContactsRefreshToken(
  fromGoogle: string | null | undefined,
  existingToken: string | null,
  emailChanged: boolean,
): string | null {
  if (fromGoogle?.trim()) {
    return fromGoogle.trim();
  }
  if (emailChanged) {
    return null;
  }
  return existingToken;
}
