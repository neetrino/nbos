import {
  PrismaClient,
  type AiProviderConnectionStatusEnum,
  type InputJsonValue,
} from '@nbos/database';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { lockLiveProviderConnection } from './ai-provider-connection.lock';
import {
  toProviderConnectionView,
  type AiProviderConnectionView,
} from './ai-provider-connection.mapper';
import { assertNoProviderSecretFields } from './ai-provider-key';
import type { AiProviderCredentials } from './ai-provider.types';
import type { AiProviderSecretStore } from './ai-provider-secret.store';

const REVOKED_CONNECTION_IS_IMMUTABLE = 'A revoked provider connection cannot change state';

export async function logProviderConnection(
  audit: AiPlatformAuditService,
  tx: PrismaTransaction,
  entityId: string,
  action: string,
  actingEmployeeId: string,
  changes: InputJsonValue,
): Promise<void> {
  assertNoProviderSecretFields(changes);
  await audit.logAdminAction(
    {
      entityType: AI_AUDIT_ENTITY.providerConnection,
      entityId,
      action,
      actingEmployeeId,
      changes,
    },
    tx,
  );
}

export async function readProviderCredentials(
  secrets: AiProviderSecretStore,
  connection: AiProviderConnectionView,
): Promise<AiProviderCredentials> {
  return {
    apiKey: await secrets.read(connection.id),
    baseUrl: connection.baseUrl,
    organizationId: connection.providerOrganizationId,
    projectId: connection.providerProjectId,
  };
}

export async function transitionProviderConnection(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AiPlatformAuditService,
  connectionId: string,
  status: AiProviderConnectionStatusEnum,
  action: string,
  actingEmployeeId: string,
): Promise<AiProviderConnectionView> {
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await lockLiveProviderConnection(tx, connectionId, REVOKED_CONNECTION_IS_IMMUTABLE);
    const row = await tx.aiProviderConnection.update({
      where: { id: connectionId },
      data: { status, disabledAt: status === 'DISABLED' ? now : null },
    });
    await logProviderConnection(audit, tx, connectionId, action, actingEmployeeId, { status });
    return row;
  });
  return toProviderConnectionView(updated);
}
