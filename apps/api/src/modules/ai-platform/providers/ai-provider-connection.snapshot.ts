import { NotFoundException } from '@nestjs/common';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import type { AiProviderCredentials } from './ai-provider.types';
import {
  lockLiveProviderConnection,
  toProviderConfigRevision,
  type LockedProviderConnection,
  type ProviderConfigRevision,
} from './ai-provider-connection.lock';

const REVOKED_CONNECTION_IS_IMMUTABLE = 'A revoked provider connection cannot change state';

export interface LockedProviderConfig {
  locked: LockedProviderConnection;
  revision: ProviderConfigRevision;
  encryptedApiKey: string;
}

export async function lockProviderConfig(
  tx: PrismaTransaction,
  connectionId: string,
): Promise<LockedProviderConfig> {
  const locked = await lockLiveProviderConnection(
    tx,
    connectionId,
    REVOKED_CONNECTION_IS_IMMUTABLE,
  );
  const secret = await tx.aiProviderSecret.findUnique({
    where: { connectionId },
    select: { encryptedApiKey: true },
  });
  if (!secret) {
    throw new NotFoundException('Provider secret not found');
  }
  return {
    locked,
    revision: toProviderConfigRevision(locked, secret.encryptedApiKey),
    encryptedApiKey: secret.encryptedApiKey,
  };
}

export function credentialsFromLockedConfig(
  config: LockedProviderConfig,
  apiKey: string,
): AiProviderCredentials {
  return {
    apiKey,
    baseUrl: config.locked.baseUrl,
    organizationId: config.locked.providerOrganizationId,
    projectId: config.locked.providerProjectId,
  };
}
