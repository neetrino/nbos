import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import { providerConfigChanged } from './ai-provider-connection.lock';
import {
  toProviderConnectionView,
  type AiProviderConnectionView,
} from './ai-provider-connection.mapper';
import { logProviderConnection } from './ai-provider-connection.persist';
import { credentialsFromLockedConfig, lockProviderConfig } from './ai-provider-connection.snapshot';
import { requireProviderApiKey, toProviderKeyPrefix } from './ai-provider-key';
import { AiProviderSecretStore } from './ai-provider-secret.store';
import type { AiProviderValidationResult } from './ai-provider.types';

type ProviderPrisma = InstanceType<typeof PrismaClient>;

/**
 * Preflight for a replacement key. Both outcomes are audited: a burst of failed
 * preflights against a live connection is the observable signature of someone
 * probing provider keys, and it must not be visible only in transport logs.
 */
export async function validateReplacementProviderKey(
  prisma: ProviderPrisma,
  adapters: AiProviderAdapterRegistry,
  audit: AiPlatformAuditService,
  connectionId: string,
  apiKey: string,
  actingEmployeeId: string,
): Promise<AiProviderValidationResult> {
  const nextKey = requireProviderApiKey(apiKey);
  const snapshot = await prisma.$transaction((tx) => lockProviderConfig(tx, connectionId));
  const result = await adapters
    .get(snapshot.locked.provider)
    .validate(credentialsFromLockedConfig(snapshot, nextKey));
  await logProviderKeyPreflight(prisma, audit, connectionId, actingEmployeeId, result);
  return result;
}

export async function rotateValidatedProviderKey(
  prisma: ProviderPrisma,
  secrets: AiProviderSecretStore,
  adapters: AiProviderAdapterRegistry,
  audit: AiPlatformAuditService,
  connectionId: string,
  apiKey: string,
  actingEmployeeId: string,
): Promise<AiProviderConnectionView> {
  const nextKey = requireProviderApiKey(apiKey);
  const keyPrefix = toProviderKeyPrefix(nextKey);
  const snapshot = await prisma.$transaction((tx) => lockProviderConfig(tx, connectionId));
  const result = await adapters
    .get(snapshot.locked.provider)
    .validate(credentialsFromLockedConfig(snapshot, nextKey));
  if (!result.ok) {
    await logProviderKeyPreflight(prisma, audit, connectionId, actingEmployeeId, result);
    throw new BadRequestException(result.errorCode ?? 'Replacement key failed validation');
  }
  return commitRotatedProviderKey(
    prisma,
    secrets,
    audit,
    { connectionId, keyPrefix, actingEmployeeId, snapshotRevision: snapshot.revision },
    nextKey,
  );
}

export async function validateStoredProviderConnection(
  prisma: ProviderPrisma,
  secrets: AiProviderSecretStore,
  adapters: AiProviderAdapterRegistry,
  audit: AiPlatformAuditService,
  connectionId: string,
  actingEmployeeId: string,
): Promise<{ connection: AiProviderConnectionView; result: AiProviderValidationResult }> {
  const snapshot = await prisma.$transaction(async (tx) => {
    const config = await lockProviderConfig(tx, connectionId);
    if (config.locked.status !== 'ACTIVE') {
      throw new BadRequestException('Only an active connection can be validated');
    }
    return config;
  });
  const result = await adapters
    .get(snapshot.locked.provider)
    .validate(
      credentialsFromLockedConfig(snapshot, secrets.decryptCipher(snapshot.encryptedApiKey)),
    );
  const updated = await commitValidationResult(
    prisma,
    audit,
    { connectionId, actingEmployeeId, snapshotRevision: snapshot.revision },
    result,
  );
  return { connection: toProviderConnectionView(updated), result };
}

async function logProviderKeyPreflight(
  prisma: ProviderPrisma,
  audit: AiPlatformAuditService,
  connectionId: string,
  actingEmployeeId: string,
  result: AiProviderValidationResult,
): Promise<void> {
  await prisma.$transaction((tx) =>
    logProviderConnection(
      audit,
      tx,
      connectionId,
      AI_AUDIT_ACTION.providerKeyPreflight,
      actingEmployeeId,
      { ok: result.ok, errorCode: result.errorCode ?? null },
    ),
  );
}

async function commitRotatedProviderKey(
  prisma: ProviderPrisma,
  secrets: AiProviderSecretStore,
  audit: AiPlatformAuditService,
  params: {
    connectionId: string;
    keyPrefix: string;
    actingEmployeeId: string;
    snapshotRevision: Awaited<ReturnType<typeof lockProviderConfig>>['revision'];
  },
  nextKey: string,
) {
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const current = await lockProviderConfig(tx, params.connectionId);
    if (providerConfigChanged(params.snapshotRevision, current.revision)) {
      throw new ConflictException('Provider configuration changed during rotation');
    }
    await secrets.write(params.connectionId, nextKey, tx);
    // The preflight proved the new key, not that the connection is still in
    // service: a disable that commits while the provider call is in flight does
    // not change the config revision, so the status is re-read here and a
    // connection an operator has just taken out of service is never stamped as
    // freshly validated.
    const stillActive = current.locked.status === 'ACTIVE';
    const row = await tx.aiProviderConnection.update({
      where: { id: params.connectionId },
      data: {
        keyPrefix: params.keyPrefix,
        ...(stillActive ? { lastValidatedAt: now } : {}),
      },
    });
    await logProviderConnection(
      audit,
      tx,
      params.connectionId,
      AI_AUDIT_ACTION.providerKeyRotated,
      params.actingEmployeeId,
      { keyPrefix: params.keyPrefix, statusAtCommit: current.locked.status },
    );
    return row;
  });
  return toProviderConnectionView(updated);
}

async function commitValidationResult(
  prisma: ProviderPrisma,
  audit: AiPlatformAuditService,
  params: {
    connectionId: string;
    actingEmployeeId: string;
    snapshotRevision: Awaited<ReturnType<typeof lockProviderConfig>>['revision'];
  },
  result: AiProviderValidationResult,
) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const current = await lockProviderConfig(tx, params.connectionId);
    if (providerConfigChanged(params.snapshotRevision, current.revision)) {
      throw new ConflictException('Provider configuration changed during validation');
    }
    // A disable or revoke that commits while the provider call is in flight wins:
    // stamping `lastValidatedAt` here would present a connection an operator has
    // just taken out of service as freshly validated.
    const stillActive = current.locked.status === 'ACTIVE';
    const row = await tx.aiProviderConnection.update({
      where: { id: params.connectionId },
      data: result.ok && stillActive ? { lastValidatedAt: now } : {},
    });
    await logProviderConnection(
      audit,
      tx,
      params.connectionId,
      AI_AUDIT_ACTION.providerValidated,
      params.actingEmployeeId,
      { ok: result.ok, errorCode: result.errorCode, statusAtCommit: current.locked.status },
    );
    return row;
  });
}
