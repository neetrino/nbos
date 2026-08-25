export const AUTHENTICATED_APP_HOME_PATH = '/dashboard';

/** Logged-in visitors hitting `/` go straight to the app home; guests stay on the landing page. */
export function getAuthenticatedRootRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (pathname === '/' && isAuthenticated) {
    return AUTHENTICATED_APP_HOME_PATH;
  }
  return null;
}
