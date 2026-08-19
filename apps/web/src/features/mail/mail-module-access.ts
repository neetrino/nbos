export type MailModuleAccessPhase = 'loading' | 'allowed' | 'denied';

/** Gate Mail UI until `/api/me` permissions are known — avoids a false "No access" flash. */
export function resolveMailModuleAccessPhase(
  permissionsLoading: boolean,
  canViewMail: boolean,
): MailModuleAccessPhase {
  if (permissionsLoading) {
    return 'loading';
  }
  return canViewMail ? 'allowed' : 'denied';
}
