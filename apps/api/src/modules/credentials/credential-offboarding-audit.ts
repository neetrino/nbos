import type { AuditService } from '../audit/audit.service';

const OFFBOARD_REVOKE_ACTION = 'credential.access_revoked';

/** Audit manual credential access removed during employee offboarding. */
export async function auditCredentialAccessRevokedOnOffboard(
  auditService: AuditService,
  credentialIds: string[],
  employeeId: string,
  actorId: string,
): Promise<void> {
  const uniqueIds = [...new Set(credentialIds)];
  for (const credentialId of uniqueIds) {
    await auditService.log({
      entityType: 'credential',
      entityId: credentialId,
      action: OFFBOARD_REVOKE_ACTION,
      userId: actorId,
      changes: { employeeId, source: 'employee.offboard' },
    });
  }
}
