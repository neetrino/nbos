import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CredentialsAccessContext } from './credentials-access';
import { assertFreshCredentialStepUp } from './credential-vault-access';
import {
  EMERGENCY_ACCESS_REASON_MIN_LENGTH,
  EMERGENCY_ACCESS_REASON_PREFIX,
  EMERGENCY_ACCESS_TTL_MS,
} from './credential-emergency-access.constants';
import { assertEmergencyAccessRole } from './credential-emergency-access.policy';
import { notifyCredentialHighRiskRecipients } from './credential-high-risk-notify';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsRuntime } from './credentials-runtime';

const RESOURCE_TYPE_CREDENTIAL = 'credential';

export interface GrantCredentialEmergencyAccessInput {
  reason: string;
  stepUpPassword?: string;
}

export async function grantCredentialEmergencyAccess(
  runtime: CredentialsRuntime,
  credentialId: string,
  input: GrantCredentialEmergencyAccessInput,
  access: CredentialsAccessContext,
) {
  await assertEmergencyAccessRole(runtime.prisma, access.employeeId);

  const reason = input.reason?.trim() ?? '';
  if (reason.length < EMERGENCY_ACCESS_REASON_MIN_LENGTH) {
    throw new BadRequestException(
      `Reason must be at least ${EMERGENCY_ACCESS_REASON_MIN_LENGTH} characters`,
    );
  }

  await assertFreshCredentialStepUp(
    runtime,
    access.employeeId,
    input.stepUpPassword,
    'emergency_access',
  );

  const credential = await runtime.prisma.credential.findFirst({
    where: { id: credentialId, archivedAt: null },
    select: { id: true, name: true, ownerId: true, criticality: true, projectId: true },
  });
  if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);

  const alreadyVisible = await runtime.prisma.credential.findFirst({
    where: {
      id: credentialId,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'view',
      )),
    },
    select: { id: true },
  });
  if (alreadyVisible) {
    throw new BadRequestException('You already have access to this credential');
  }

  const expiresAt = new Date(Date.now() + EMERGENCY_ACCESS_TTL_MS);
  const grantReason = `${EMERGENCY_ACCESS_REASON_PREFIX} ${reason}`;

  await runtime.prisma.resourceAccessGrant.upsert({
    where: {
      resourceType_resourceId_employeeId: {
        resourceType: RESOURCE_TYPE_CREDENTIAL,
        resourceId: credentialId,
        employeeId: access.employeeId,
      },
    },
    create: {
      resourceType: RESOURCE_TYPE_CREDENTIAL,
      resourceId: credentialId,
      employeeId: access.employeeId,
      level: 'VIEW',
      grantedById: access.employeeId,
      reason: grantReason,
      expiresAt,
    },
    update: {
      revokedAt: null,
      level: 'VIEW',
      grantedById: access.employeeId,
      reason: grantReason,
      expiresAt,
    },
  });

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credentialId,
    action: 'credential.emergency_access_used',
    userId: access.employeeId,
    projectId: credential.projectId ?? undefined,
    changes: { reason, expiresAt: expiresAt.toISOString() },
  });

  await notifyCredentialHighRiskRecipients(runtime.prisma, runtime.notifications, {
    actorId: access.employeeId,
    title: 'Emergency credential access',
    body: `Break-glass VIEW until ${expiresAt.toISOString()} for ${credential.name ?? credentialId}. Reason: ${reason}`,
    entityId: credentialId,
    ownerId: credential.ownerId,
    dedupeSuffix: `emergency:${credentialId}:${access.employeeId}`,
  });

  return {
    credentialId,
    expiresAt: expiresAt.toISOString(),
    level: 'VIEW' as const,
  };
}
