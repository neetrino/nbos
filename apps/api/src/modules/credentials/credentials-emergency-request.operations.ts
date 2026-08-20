import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { isOwnerOnlyConfidentiality, PLATFORM_OWNERSHIP_SINGLETON_ID } from '@nbos/shared';
import type { CredentialsAccessContext } from './credentials-access';
import { assertFreshCredentialStepUp } from './credential-vault-access';
import {
  EMERGENCY_ACCESS_REASON_MIN_LENGTH,
  EMERGENCY_ACCESS_TTL_MS,
} from './credential-emergency-access.constants';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsRuntime } from './credentials-runtime';

export async function requestCredentialEmergencyAccess(
  runtime: CredentialsRuntime,
  credentialId: string,
  input: { reason: string; stepUpPassword?: string },
  access: CredentialsAccessContext,
) {
  if (access.bypassRowVisibility) {
    throw new BadRequestException('Platform owner already has vault access');
  }
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
  const credential = await loadRequestableCredential(runtime, credentialId);
  await assertNotAlreadyVisible(runtime, credentialId, access);
  await assertNoPendingRequest(runtime, credentialId, access.employeeId);

  const request = await runtime.prisma.credentialEmergencyAccessRequest.create({
    data: {
      credentialId,
      requesterId: access.employeeId,
      reason,
      ttlMs: EMERGENCY_ACCESS_TTL_MS,
      status: 'PENDING',
    },
  });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credentialId,
    action: 'credential.emergency_access_requested',
    userId: access.employeeId,
    projectId: credential.projectId ?? undefined,
    changes: { reason, requestId: request.id },
  });
  await notifyFounderOfEmergencyRequest(runtime, access.employeeId, credential, reason);
  return { requestId: request.id, status: 'PENDING' as const };
}

async function loadRequestableCredential(runtime: CredentialsRuntime, credentialId: string) {
  const credential = await runtime.prisma.credential.findFirst({
    where: { id: credentialId, trashedAt: null },
    select: {
      id: true,
      name: true,
      ownerId: true,
      projectId: true,
      confidentiality: true,
    },
  });
  if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);
  if (isOwnerOnlyConfidentiality(credential.confidentiality)) {
    throw new ForbiddenException('OWNER_ONLY credentials cannot be requested.');
  }
  return credential;
}

async function assertNotAlreadyVisible(
  runtime: CredentialsRuntime,
  credentialId: string,
  access: CredentialsAccessContext,
): Promise<void> {
  const alreadyVisible = await runtime.prisma.credential.findFirst({
    where: {
      id: credentialId,
      trashedAt: null,
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
}

async function assertNoPendingRequest(
  runtime: CredentialsRuntime,
  credentialId: string,
  requesterId: string,
): Promise<void> {
  const existing = await runtime.prisma.credentialEmergencyAccessRequest.findFirst({
    where: { credentialId, requesterId, status: 'PENDING' },
    select: { id: true },
  });
  if (existing) {
    throw new BadRequestException('A pending emergency request already exists');
  }
}

async function notifyFounderOfEmergencyRequest(
  runtime: CredentialsRuntime,
  actorId: string,
  credential: { id: string; name: string | null; ownerId: string | null },
  reason: string,
): Promise<void> {
  const ownership = await runtime.prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true },
  });
  const founderId = ownership?.ownerEmployeeId;
  if (!founderId || founderId === actorId) return;
  await runtime.notifications.createMany({
    recipientIds: [founderId],
    type: 'credentials.emergency_access_requested',
    title: 'Emergency credential access requested',
    body: `${credential.name ?? credential.id}: ${reason}`,
    entityType: 'credential',
    entityId: credential.id,
    sourceModule: 'credentials',
    dedupeKeyPrefix: 'credentials.emergency_access_requested',
    dedupeKeySuffix: `${credential.id}:${actorId}`,
  });
}
