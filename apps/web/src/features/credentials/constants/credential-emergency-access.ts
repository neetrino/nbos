/** UI hint only. API enforces request vs Founder approval. */
export function canRequestCredentialEmergencyAccess(
  accessDenied: boolean,
  isPlatformOwner: boolean,
): boolean {
  return accessDenied && !isPlatformOwner;
}
