import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AiProviderConnectionStatusEnum, AiProviderTypeEnum } from '@nbos/database';
import type { PrismaTransaction } from '../agents/agent-row-lock';

export interface LockedProviderConnection {
  id: string;
  status: AiProviderConnectionStatusEnum;
  revokedAt: Date | null;
  provider: AiProviderTypeEnum;
  keyPrefix: string;
  baseUrl: string | null;
  providerOrganizationId: string | null;
  providerProjectId: string | null;
  updatedAt: Date;
}

export interface ProviderConfigRevision {
  secretFingerprint: string;
  provider: AiProviderTypeEnum;
  baseUrl: string | null;
  providerOrganizationId: string | null;
  providerProjectId: string | null;
}

export function toProviderConfigRevision(
  connection: Pick<
    LockedProviderConnection,
    'provider' | 'baseUrl' | 'providerOrganizationId' | 'providerProjectId'
  >,
  encryptedApiKey: string | null,
): ProviderConfigRevision {
  return {
    secretFingerprint: encryptedApiKey ?? '',
    provider: connection.provider,
    baseUrl: connection.baseUrl,
    providerOrganizationId: connection.providerOrganizationId,
    providerProjectId: connection.providerProjectId,
  };
}

export function providerConfigChanged(
  left: ProviderConfigRevision,
  right: ProviderConfigRevision,
): boolean {
  return (
    left.secretFingerprint !== right.secretFingerprint ||
    left.provider !== right.provider ||
    left.baseUrl !== right.baseUrl ||
    left.providerOrganizationId !== right.providerOrganizationId ||
    left.providerProjectId !== right.providerProjectId
  );
}

export function validationRelevantFieldsChanged(
  current: Pick<
    LockedProviderConnection,
    'baseUrl' | 'providerOrganizationId' | 'providerProjectId'
  >,
  next: {
    baseUrl: string | null;
    providerOrganizationId: string | null;
    providerProjectId: string | null;
  },
): boolean {
  return (
    current.baseUrl !== next.baseUrl ||
    current.providerOrganizationId !== next.providerOrganizationId ||
    current.providerProjectId !== next.providerProjectId
  );
}

export async function lockProviderConnection(
  tx: PrismaTransaction,
  connectionId: string,
): Promise<LockedProviderConnection> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM ai_provider_connections WHERE id = ${connectionId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Provider connection not found');
  }
  return tx.aiProviderConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: {
      id: true,
      status: true,
      revokedAt: true,
      provider: true,
      keyPrefix: true,
      baseUrl: true,
      providerOrganizationId: true,
      providerProjectId: true,
      updatedAt: true,
    },
  });
}

export function isProviderConnectionRevoked(
  connection: Pick<LockedProviderConnection, 'status' | 'revokedAt'>,
): boolean {
  return connection.status === 'REVOKED' || connection.revokedAt !== null;
}

export async function lockLiveProviderConnection(
  tx: PrismaTransaction,
  connectionId: string,
  reason: string,
): Promise<LockedProviderConnection> {
  const connection = await lockProviderConnection(tx, connectionId);
  if (isProviderConnectionRevoked(connection)) {
    throw new BadRequestException(reason);
  }
  return connection;
}
