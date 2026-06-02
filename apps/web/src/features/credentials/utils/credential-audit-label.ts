const CREDENTIAL_AUDIT_LABELS: Record<string, string> = {
  'credential.view': 'Viewed',
  'credential.create': 'Created',
  'credential.update': 'Updated',
  'credential.archived': 'Archived',
  'credential.restored': 'Restored',
  'credential.permanently_deleted': 'Permanently deleted',
  'credential.secret_revealed': 'Secret revealed',
  'credential.secret_copied': 'Secret copied',
  'credential.url_opened': 'URL opened',
  'credential.exported': 'Exported',
  'credential.manual_access_updated': 'Manual access updated',
  'credential.access_revoked': 'Access revoked',
  'credential.emergency_access_used': 'Emergency access granted',
  'credential.step_up_verified': 'Step-up verified',
};

export function labelCredentialAuditAction(action: string): string {
  return CREDENTIAL_AUDIT_LABELS[action] ?? action.replaceAll('_', ' ');
}
