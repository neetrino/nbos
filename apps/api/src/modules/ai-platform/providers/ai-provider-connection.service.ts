import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import {
  lockLiveProviderConnection,
  lockProviderConnection,
  isProviderConnectionRevoked,
} from './ai-provider-connection.lock';
import {
  rotateValidatedProviderKey,
  validateReplacementProviderKey,
  validateStoredProviderConnection,
} from './ai-provider-connection.validate-ops';
import {
  toProviderConnectionView,
  type AiProviderConnectionView,
} from './ai-provider-connection.mapper';
import {
  normalizeOptionalBaseUrl,
  normalizeOptionalMetadata,
  requireProviderName,
  requireProviderType,
  resolveProviderConnectionUpdate,
} from './ai-provider-connection.rules';
import { requireProviderApiKey, toProviderKeyPrefix } from './ai-provider-key';
import { AiProviderSecretStore } from './ai-provider-secret.store';
import {
  logProviderConnection,
  readProviderCredentials,
  transitionProviderConnection,
} from './ai-provider-connection.persist';
import { validateUnsavedProviderKey } from './ai-provider-draft-validate';
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
      await logProviderConnection(
        this.audit,
        tx,
        row.id,
        AI_AUDIT_ACTION.providerCreated,
        actingEmployeeId,
        {
          provider,
          name,
          keyPrefix,
        },
      );
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
        data: resolveProviderConnectionUpdate(locked, { ...input, name }),
      });
      await logProviderConnection(
        this.audit,
        tx,
        connectionId,
        AI_AUDIT_ACTION.providerUpdated,
        actingEmployeeId,
        {
          nameChanged: name !== undefined,
        },
      );
      return row;
    });
    return toProviderConnectionView(updated);
  }

  async rotateKey(
    connectionId: string,
    apiKey: string,
    actingEmployeeId: string,
  ): Promise<AiProviderConnectionView> {
    return rotateValidatedProviderKey(
      this.prisma,
      this.secrets,
      this.adapters,
      this.audit,
      connectionId,
      apiKey,
      actingEmployeeId,
    );
  }

  async validateDraft(input: {
    provider: string;
    apiKey: string;
    baseUrl?: string | null;
  }): Promise<AiProviderValidationResult> {
    return validateUnsavedProviderKey(this.adapters, input);
  }

  async validateReplacementKey(
    connectionId: string,
    apiKey: string,
    actingEmployeeId: string,
  ): Promise<AiProviderValidationResult> {
    return validateReplacementProviderKey(
      this.prisma,
      this.adapters,
      this.audit,
      connectionId,
      apiKey,
      actingEmployeeId,
    );
  }

  async validate(
    connectionId: string,
    actingEmployeeId: string,
  ): Promise<{ connection: AiProviderConnectionView; result: AiProviderValidationResult }> {
    return validateStoredProviderConnection(
      this.prisma,
      this.secrets,
      this.adapters,
      this.audit,
      connectionId,
      actingEmployeeId,
    );
  }

  async disable(connectionId: string, actingEmployeeId: string): Promise<AiProviderConnectionView> {
    return transitionProviderConnection(
      this.prisma,
      this.audit,
      connectionId,
      'DISABLED',
      AI_AUDIT_ACTION.providerDisabled,
      actingEmployeeId,
    );
  }

  async enable(connectionId: string, actingEmployeeId: string): Promise<AiProviderConnectionView> {
    return transitionProviderConnection(
      this.prisma,
      this.audit,
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
      await logProviderConnection(
        this.audit,
        tx,
        connectionId,
        AI_AUDIT_ACTION.providerRevoked,
        actingEmployeeId,
        {
          revokedAt: now.toISOString(),
        },
      );
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
    return { connection, credentials: await readProviderCredentials(this.secrets, connection) };
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
}
