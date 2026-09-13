export const CREDENTIAL_AUDIT_ACTION_KEYS = {
  'credential.view': 'audit.viewed',
  'credential.create': 'audit.created',
  'credential.update': 'audit.updated',
  'credential.archived': 'audit.archived',
  'credential.restored': 'audit.restored',
  'credential.permanently_deleted': 'audit.permanentlyDeleted',
  'credential.secret_revealed': 'audit.secretRevealed',
  'credential.secret_copied': 'audit.secretCopied',
  'credential.url_opened': 'audit.urlOpened',
  'credential.exported': 'audit.exported',
  'credential.manual_access_updated': 'audit.manualAccessUpdated',
  'credential.access_revoked': 'audit.accessRevoked',
  'credential.emergency_access_used': 'audit.emergencyAccessGranted',
  'credential.emergency_access_requested': 'audit.emergencyAccessRequested',
  'credential.emergency_access_approved': 'audit.emergencyAccessApproved',
  'credential.emergency_access_denied': 'audit.emergencyAccessDenied',
  'credential.secret_version_revealed': 'audit.secretVersionRevealed',
  'credential.step_up_verified': 'audit.stepUpVerified',
  'credential.vault_unlocked': 'audit.vaultUnlocked',
  'credential.vault_locked': 'audit.vaultLocked',
} as const;

export type CredentialAuditActionKey =
  (typeof CREDENTIAL_AUDIT_ACTION_KEYS)[keyof typeof CREDENTIAL_AUDIT_ACTION_KEYS];

/** Maps a persisted audit action code to a catalog key. Unknown codes stay untranslated. */
export function credentialAuditActionMessageKey(action: string): CredentialAuditActionKey | null {
  if (Object.prototype.hasOwnProperty.call(CREDENTIAL_AUDIT_ACTION_KEYS, action)) {
    return CREDENTIAL_AUDIT_ACTION_KEYS[action as keyof typeof CREDENTIAL_AUDIT_ACTION_KEYS];
  }
  return null;
}

export function labelCredentialAuditAction(action: string, t: (key: never) => string): string {
  const key = credentialAuditActionMessageKey(action);
  return key ? t(key as never) : action;
}
