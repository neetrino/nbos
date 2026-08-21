import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type AiProviderConnectionStatusEnum,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import {
  lockLiveProviderConnection,
  lockProviderConnection,
  isProviderConnectionRevoked,
} from './ai-provider-connection.lock';
import {
  toProviderConnectionView,
  type AiProviderConnectionView,
} from './ai-provider-connection.mapper';
import {
  normalizeOptionalBaseUrl,
  normalizeOptionalMetadata,
  requireProviderName,
  requireProviderType,
} from './ai-provider-connection.rules';
import {
  assertNoProviderSecretFields,
  requireProviderApiKey,
  toProviderKeyPrefix,
} from './ai-provider-key';
import { AiProviderSecretStore } from './ai-provider-secret.store';
import type { AiProviderCredentials, AiProviderValidationResult } from './ai-provider.types';

const REVOKED_CONNECTION_IS_IMMUTABLE = 'A revoked provider connection cannot change state';

export interface CreateProviderConnectionInput {
  provider: string;
  name: string;
  apiKey: string;
  providerOrganizationId?: string | null;
  providerProjectId?: string | null;
  baseUrl?: string | null;
}

export interface UpdateProviderConnectionInput {
  name?: string;
  providerOrganizationId?: string | null;
  providerProjectId?: string | null;
  baseUrl?: string | null;
}

@Injectable()
export class AiProviderConnectionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
    private readonly secrets: AiProviderSecretStore,
    private readonly adapters: AiProviderAdapterRegistry,
  ) {}

  async create(
    input: CreateProviderConnectionInput,
    actingEmployeeId: string,
  ): Promise<AiProviderConnectionView> {
    const name = requireProviderName(input.name);
    const provider = requireProviderType(input.provider);
    const apiKey = requireProviderApiKey(input.apiKey);
    const keyPrefix = toProviderKeyPrefix(apiKey);
    const data = {
      provider,
      name,
      keyPrefix,
      providerOrganizationId: normalizeOptionalMetadata(input.providerOrganizationId) ?? null,
      providerProjectId: normalizeOptionalMetadata(input.providerProjectId) ?? null,
      baseUrl: normalizeOptionalBaseUrl(input.baseUrl, provider) ?? null,
      createdById: actingEmployeeId,
    };
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.aiProviderConnection.create({ data });
      await this.secrets.write(row.id, apiKey, tx);
      await this.log(tx, row.id, AI_AUDIT_ACTION.providerCreated, actingEmployeeId, {
        provider,
        name,
        keyPrefix,
      });
      return row;
    });
    return toProviderConnectionView(created);
  }

  async update(
    connectionId: string,
    input: UpdateProviderConnectionInput,
    actingEmployeeId: string,
  ): Promise<AiProviderConnectionView> {
    const name = input.name === undefined ? undefined : requireProviderName(input.name);
    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await lockLiveProviderConnection(
        tx,
        connectionId,
        REVOKED_CONNECTION_IS_IMMUTABLE,
      );
      const row = await tx.aiProviderConnection.update({
        where: { id: connectionId },
        data: {
          ...(name === undefined ? {} : { name }),
          ...(input.providerOrganizationId === undefined
            ? {}
            : { providerOrganizationId: normalizeOptionalMetadata(input.providerOrganizationId) }),
          ...(input.providerProjectId === undefined
            ? {}
            : { providerProjectId: normalizeOptionalMetadata(input.providerProjectId) }),
          ...(input.baseUrl === undefined
            ? {}
            : { baseUrl: normalizeOptionalBaseUrl(input.baseUrl, locked.provider) }),
        },
      });
      await this.log(tx, connectionId, AI_AUDIT_ACTION.providerUpdated, actingEmployeeId, {
        nameChanged: name !== undefined,
      });
      return row;
    });
    return toProviderConnectionView(updated);
  }

  async rotateKey(
    connectionId: string,
    apiKey: string,
    actingEmployeeId: string,
  ): Promise<AiProviderConnectionView> {
    const nextKey = requireProviderApiKey(apiKey);
    const keyPrefix = toProviderKeyPrefix(nextKey);
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockLiveProviderConnection(tx, connectionId, REVOKED_CONNECTION_IS_IMMUTABLE);
      await this.secrets.write(connectionId, nextKey, tx);
      const row = await tx.aiProviderConnection.update({
        where: { id: connectionId },
        data: { keyPrefix, lastValidatedAt: null },
      });
      await this.log(tx, connectionId, AI_AUDIT_ACTION.providerKeyRotated, actingEmployeeId, {
        keyPrefix,
      });
      return row;
    });
    return toProviderConnectionView(updated);
  }

  async validate(
    connectionId: string,
    actingEmployeeId: string,
  ): Promise<{ connection: AiProviderConnectionView; result: AiProviderValidationResult }> {
    const connection = await this.requireConnection(connectionId);
    if (connection.status !== 'ACTIVE') {
      throw new BadRequestException('Only an active connection can be validated');
    }
    const credentials = await this.credentials(connection);
    const result = await this.adapters.get(connection.provider).validate(credentials);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockLiveProviderConnection(tx, connectionId, REVOKED_CONNECTION_IS_IMMUTABLE);
      const row = await tx.aiProviderConnection.update({
        where: { id: connectionId },
        data: result.ok ? { lastValidatedAt: now } : {},
      });
      await this.log(tx, connectionId, AI_AUDIT_ACTION.providerValidated, actingEmployeeId, {
        ok: result.ok,
        errorCode: result.errorCode,
      });
      return row;
    });
    return { connection: toProviderConnectionView(updated), result };
  }

  async disable(connectionId: string, actingEmployeeId: string): Promise<AiProviderConnectionView> {
    return this.transition(
      connectionId,
      'DISABLED',
      AI_AUDIT_ACTION.providerDisabled,
      actingEmployeeId,
    );
  }

  async enable(connectionId: string, actingEmployeeId: string): Promise<AiProviderConnectionView> {
    return this.transition(
      connectionId,
      'ACTIVE',
      AI_AUDIT_ACTION.providerEnabled,
      actingEmployeeId,
    );
  }

  async revoke(connectionId: string, actingEmployeeId: string): Promise<AiProviderConnectionView> {
    const now = new Date();
    const revoked = await this.prisma.$transaction(async (tx) => {
      const locked = await lockProviderConnection(tx, connectionId);
      if (isProviderConnectionRevoked(locked)) {
        return tx.aiProviderConnection.findUniqueOrThrow({ where: { id: connectionId } });
      }
      await this.secrets.delete(connectionId, tx);
      const row = await tx.aiProviderConnection.update({
        where: { id: connectionId },
        data: { status: 'REVOKED', revokedAt: now },
      });
      await this.log(tx, connectionId, AI_AUDIT_ACTION.providerRevoked, actingEmployeeId, {
        revokedAt: now.toISOString(),
      });
      return row;
    });
    return toProviderConnectionView(revoked);
  }

  async findById(connectionId: string): Promise<AiProviderConnectionView | null> {
    const row = await this.prisma.aiProviderConnection.findUnique({ where: { id: connectionId } });
    return row ? toProviderConnectionView(row) : null;
  }

  async listAll(): Promise<AiProviderConnectionView[]> {
    const rows = await this.prisma.aiProviderConnection.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toProviderConnectionView(row));
  }

  async credentialsForActive(connectionId: string): Promise<{
    connection: AiProviderConnectionView;
    credentials: AiProviderCredentials;
  }> {
    const connection = await this.requireConnection(connectionId);
    if (connection.status !== 'ACTIVE') {
      throw new BadRequestException('Provider connection is not active');
    }
    return { connection, credentials: await this.credentials(connection) };
  }

  async markModelSync(connectionId: string, at: Date, client: PrismaTransaction): Promise<void> {
    await client.aiProviderConnection.update({
      where: { id: connectionId },
      data: { lastModelSyncAt: at },
    });
  }

  private async requireConnection(connectionId: string): Promise<AiProviderConnectionView> {
    const connection = await this.findById(connectionId);
    if (!connection) {
      throw new NotFoundException('Provider connection not found');
    }
    return connection;
  }

  private async credentials(connection: AiProviderConnectionView): Promise<AiProviderCredentials> {
    return {
      apiKey: await this.secrets.read(connection.id),
      baseUrl: connection.baseUrl,
      organizationId: connection.providerOrganizationId,
      projectId: connection.providerProjectId,
    };
  }

  private async transition(
    connectionId: string,
    status: AiProviderConnectionStatusEnum,
    action: string,
    actingEmployeeId: string,
  ): Promise<AiProviderConnectionView> {
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockLiveProviderConnection(tx, connectionId, REVOKED_CONNECTION_IS_IMMUTABLE);
      const row = await tx.aiProviderConnection.update({
        where: { id: connectionId },
        data: { status, disabledAt: status === 'DISABLED' ? now : null },
      });
      await this.log(tx, connectionId, action, actingEmployeeId, { status });
      return row;
    });
    return toProviderConnectionView(updated);
  }

  private async log(
    tx: PrismaTransaction,
    entityId: string,
    action: string,
    actingEmployeeId: string,
    changes: InputJsonValue,
  ): Promise<void> {
    assertNoProviderSecretFields(changes);
    await this.audit.logAdminAction(
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
}
