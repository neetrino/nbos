import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { isOwnerOnlyConfidentiality } from '@nbos/shared';
import type { CredentialsAccessContext } from './credentials-access';
import { assertFreshCredentialStepUp } from './credential-vault-access';
import { EMERGENCY_ACCESS_REASON_PREFIX } from './credential-emergency-access.constants';
import { assertFounderEmergencyDecision } from './credential-emergency-access.policy';
import { notifyCredentialHighRiskRecipients } from './credential-high-risk-notify';
import type { CredentialsRuntime } from './credentials-runtime';

const RESOURCE_TYPE_CREDENTIAL = 'credential';

export async function listPendingEmergencyAccessRequests(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
) {
  assertFounderEmergencyDecision(access);
  const items = await runtime.prisma.credentialEmergencyAccessRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      credential: { select: { id: true, name: true } },
      requester: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return { items };
}

export async function decideEmergencyAccessRequest(
  runtime: CredentialsRuntime,
  requestId: string,
  decision: 'APPROVED' | 'DENIED',
  access: CredentialsAccessContext,
  stepUpPassword?: string,
) {
  assertFounderEmergencyDecision(access);
  await assertFreshCredentialStepUp(runtime, access.employeeId, stepUpPassword, 'emergency_access');
  const request = await runtime.prisma.credentialEmergencyAccessRequest.findFirst({
    where: { id: requestId, status: 'PENDING' },
    include: {
      credential: {
        select: { id: true, name: true, ownerId: true, projectId: true, confidentiality: true },
      },
    },
  });
  if (!request) throw new NotFoundException(`Emergency request ${requestId} not found`);
  if (decision === 'DENIED') return denyEmergencyRequest(runtime, request, access);
  return approveEmergencyRequest(runtime, request, access);
}

async function denyEmergencyRequest(
  runtime: CredentialsRuntime,
  request: EmergencyRequestRow,
  access: CredentialsAccessContext,
) {
  await runtime.prisma.credentialEmergencyAccessRequest.update({
    where: { id: request.id },
    data: { status: 'DENIED', decidedById: access.employeeId, decidedAt: new Date() },
  });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: request.credentialId,
    action: 'credential.emergency_access_denied',
    userId: access.employeeId,
    projectId: request.credential.projectId ?? undefined,
    changes: { requestId: request.id, requesterId: request.requesterId },
  });
  return { requestId: request.id, status: 'DENIED' as const };
}

async function approveEmergencyRequest(
  runtime: CredentialsRuntime,
  request: EmergencyRequestRow,
  access: CredentialsAccessContext,
) {
  if (isOwnerOnlyConfidentiality(request.credential.confidentiality)) {
    throw new ForbiddenException('OWNER_ONLY credentials cannot be granted.');
  }
  const expiresAt = new Date(Date.now() + request.ttlMs);
  const grant = await upsertEmergencyViewGrant(runtime, request, access.employeeId, expiresAt);
  await runtime.prisma.credentialEmergencyAccessRequest.update({
    where: { id: request.id },
    data: {
      status: 'APPROVED',
      decidedById: access.employeeId,
      decidedAt: new Date(),
      grantId: grant.id,
      expiresAt,
    },
  });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: request.credentialId,
    action: 'credential.emergency_access_approved',
    userId: access.employeeId,
    projectId: request.credential.projectId ?? undefined,
    changes: {
      requestId: request.id,
      requesterId: request.requesterId,
      expiresAt: expiresAt.toISOString(),
    },
  });
  await notifyCredentialHighRiskRecipients(runtime.prisma, runtime.notifications, {
    actorId: access.employeeId,
    title: 'Emergency credential access approved',
    body: `Break-glass VIEW until ${expiresAt.toISOString()} for ${request.credential.name ?? request.credentialId}.`,
    entityId: request.credentialId,
    ownerId: request.credential.ownerId,
    dedupeSuffix: `emergency-approved:${request.id}`,
  });
  return {
    requestId: request.id,
    status: 'APPROVED' as const,
    expiresAt: expiresAt.toISOString(),
    level: 'VIEW' as const,
  };
}

async function upsertEmergencyViewGrant(
  runtime: CredentialsRuntime,
  request: EmergencyRequestRow,
  grantedById: string,
  expiresAt: Date,
) {
  const grantReason = `${EMERGENCY_ACCESS_REASON_PREFIX} ${request.reason}`;
  return runtime.prisma.resourceAccessGrant.upsert({
    where: {
      resourceType_resourceId_employeeId: {
        resourceType: RESOURCE_TYPE_CREDENTIAL,
        resourceId: request.credentialId,
        employeeId: request.requesterId,
      },
    },
    create: {
      resourceType: RESOURCE_TYPE_CREDENTIAL,
      resourceId: request.credentialId,
      employeeId: request.requesterId,
      level: 'VIEW',
      grantedById,
      reason: grantReason,
      expiresAt,
    },
    update: {
      revokedAt: null,
      level: 'VIEW',
      grantedById,
      reason: grantReason,
      expiresAt,
    },
  });
}

interface EmergencyRequestRow {
  id: string;
  credentialId: string;
  requesterId: string;
  reason: string;
  ttlMs: number;
  credential: {
    id: string;
    name: string | null;
    ownerId: string | null;
    projectId: string | null;
    confidentiality: string;
  };
}
