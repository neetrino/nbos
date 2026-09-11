import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma, type WhatsAppGatewayConnectionStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import {
  WHATSAPP_AUDIT_ENTITY_GATEWAY,
  WHATSAPP_AUDIT_GATEWAY_CONFIGURED,
  WHATSAPP_AUDIT_GATEWAY_DISCONNECTED,
  WHATSAPP_AUDIT_GATEWAY_TOKEN_CHANGED,
  WHATSAPP_ERROR,
  WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
} from './whatsapp-gateway.constants';
import {
  mapGatewayErrorToDomain,
  throwWhatsAppDomainError,
  WhatsAppGatewayHttpError,
} from './whatsapp-gateway.errors';
import { WhatsAppGatewaySecretStore } from './whatsapp-gateway-secret.store';
import {
  buildWhatsAppConnectionWritePatch,
  parseAccountingGroupChatId,
} from './whatsapp-gateway-connection-write.ops';
import type {
  WhatsAppConnectionPublicView,
  WhatsAppGatewayChatsListData,
  WhatsAppGatewayGroupsListData,
} from './whatsapp-gateway.types';

const SINGLETON_ID = 'whatsapp-gateway-default';

type WhatsAppGatewayConnection = Prisma.WhatsAppGatewayConnectionModel;

@Injectable()
export class WhatsAppGatewayConnectionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly secrets: WhatsAppGatewaySecretStore,
    private readonly client: WhatsAppGatewayClient,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async getPublicView(): Promise<WhatsAppConnectionPublicView> {
    const row = await this.getOrCreateRow();
    return this.toPublic(row);
  }

  async upsertConnection(
    input: {
      baseUrl?: string;
      apiToken?: string;
      accountingGroupChatId?: string | null;
      webhookSigningSecret?: string;
      gatewayAccountId?: string | null;
    },
    actorId: string,
  ): Promise<WhatsAppConnectionPublicView> {
    const row = await this.getOrCreateRow();
    const allowHttp = this.config.get<string>('NODE_ENV') !== 'production';
    const accountingGroupChatId =
      input.accountingGroupChatId !== undefined
        ? parseAccountingGroupChatId(input.accountingGroupChatId)
        : row.accountingGroupChatId;
    const patch = buildWhatsAppConnectionWritePatch(
      row,
      input,
      this.secrets,
      allowHttp,
      accountingGroupChatId,
    );
    const updated = await this.prisma.whatsAppGatewayConnection.update({
      where: { id: row.id },
      data: patch.data,
    });
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_GATEWAY,
      entityId: updated.id,
      action: patch.tokenChanged
        ? WHATSAPP_AUDIT_GATEWAY_TOKEN_CHANGED
        : WHATSAPP_AUDIT_GATEWAY_CONFIGURED,
      userId: actorId,
      changes: { baseUrl: patch.nextBaseUrl, hasToken: true },
    });
    return this.toPublic(updated);
  }

  async disconnect(actorId: string): Promise<WhatsAppConnectionPublicView> {
    const row = await this.getOrCreateRow();
    const updated = await this.prisma.whatsAppGatewayConnection.update({
      where: { id: row.id },
      data: {
        encryptedApiToken: null,
        status: 'NOT_CONFIGURED',
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    await this.audit.log({
      entityType: WHATSAPP_AUDIT_ENTITY_GATEWAY,
      entityId: updated.id,
      action: WHATSAPP_AUDIT_GATEWAY_DISCONNECTED,
      userId: actorId,
    });
    return this.toPublic(updated);
  }

  async listGroups(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<WhatsAppGatewayGroupsListData> {
    const credentials = await this.requireClientConfig();
    try {
      return await this.client.listGroups(credentials, {
        limit: params?.limit ?? WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
        offset: params?.offset ?? 0,
        search: params?.search,
      });
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError) {
        mapGatewayErrorToDomain(error);
      }
      throw error;
    }
  }

  async listChats(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<WhatsAppGatewayChatsListData> {
    const credentials = await this.requireClientConfig();
    try {
      return await this.client.listChats(credentials, {
        limit: params?.limit ?? WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
        offset: params?.offset ?? 0,
        search: params?.search ?? '',
      });
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError) {
        mapGatewayErrorToDomain(error);
      }
      throw error;
    }
  }

  async testConnection(): Promise<WhatsAppConnectionPublicView & { healthOk: boolean }> {
    const credentials = await this.requireClientConfig();
    try {
      await this.client.health(credentials);
      await this.client.listGroups(credentials, { limit: 1, offset: 0 });
      const updated = await this.prisma.whatsAppGatewayConnection.update({
        where: { id: SINGLETON_ID },
        data: {
          status: 'CONNECTED',
          lastHealthCheckAt: new Date(),
          lastConnectedAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });
      return { ...this.toPublic(updated), healthOk: true };
    } catch (error) {
      const mapped = this.mapTestError(error);
      const updated = await this.prisma.whatsAppGatewayConnection.update({
        where: { id: SINGLETON_ID },
        data: {
          status: mapped.status,
          lastHealthCheckAt: new Date(),
          lastErrorCode: mapped.code,
          lastErrorMessage: mapped.message,
        },
      });
      throwWhatsAppDomainError(mapped.httpStatus, mapped.code, mapped.message);
      return { ...this.toPublic(updated), healthOk: false };
    }
  }

  async requireClientConfig(): Promise<{ baseUrl: string; apiToken: string }> {
    const row = await this.getOrCreateRow();
    if (!row.baseUrl || !row.encryptedApiToken) {
      const envUrl = this.config.get<string>('WHATSAPP_GATEWAY_URL')?.trim();
      if (!envUrl || !row.encryptedApiToken) {
        throwWhatsAppDomainError(
          400,
          WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
          'WhatsApp Gateway is not configured',
        );
      }
    }
    const baseUrl = (row.baseUrl ?? this.config.get<string>('WHATSAPP_GATEWAY_URL') ?? '').replace(
      /\/+$/,
      '',
    );
    if (!baseUrl || !row.encryptedApiToken) {
      throwWhatsAppDomainError(
        400,
        WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
        'WhatsApp Gateway is not configured',
      );
    }
    return {
      baseUrl,
      apiToken: this.secrets.decryptToken(row.encryptedApiToken),
    };
  }

  async requireWebhookSigningSecret(): Promise<string> {
    const row = await this.getOrCreateRow();
    if (row.encryptedWebhookSecret) {
      return this.secrets.decryptToken(row.encryptedWebhookSecret);
    }
    const fromEnv = this.config.get<string>('WHATSAPP_GATEWAY_WEBHOOK_SECRET')?.trim();
    if (fromEnv) return fromEnv;
    throwWhatsAppDomainError(
      503,
      WHATSAPP_ERROR.WEBHOOK_SECRET_NOT_CONFIGURED,
      'WhatsApp Gateway webhook signing secret is not configured',
    );
  }

  private async getOrCreateRow(): Promise<WhatsAppGatewayConnection> {
    const existing = await this.prisma.whatsAppGatewayConnection.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) return existing;
    return this.prisma.whatsAppGatewayConnection.create({
      data: { id: SINGLETON_ID, status: 'NOT_CONFIGURED' },
    });
  }

  private toPublic(row: WhatsAppGatewayConnection): WhatsAppConnectionPublicView {
    return {
      configured: Boolean(row.baseUrl && row.encryptedApiToken),
      baseUrl: row.baseUrl,
      hasToken: Boolean(row.encryptedApiToken),
      status: row.status,
      lastHealthCheckAt: row.lastHealthCheckAt?.toISOString() ?? null,
      lastConnectedAt: row.lastConnectedAt?.toISOString() ?? null,
      lastErrorCode: row.lastErrorCode,
      lastErrorMessage: row.lastErrorMessage,
      accountingGroupChatId: row.accountingGroupChatId,
      hasWebhookSecret: Boolean(row.encryptedWebhookSecret),
      gatewayAccountId: row.gatewayAccountId,
    };
  }

  private mapTestError(error: unknown): {
    status: WhatsAppGatewayConnectionStatusEnum;
    code: string;
    message: string;
    httpStatus: 400 | 401 | 409 | 503;
  } {
    if (error instanceof WhatsAppGatewayHttpError) {
      if (
        error.code === 'UNAUTHORIZED' ||
        error.code === 'INVALID_TOKEN' ||
        error.code === 'TOKEN_REVOKED'
      ) {
        return {
          status: 'ERROR',
          code: WHATSAPP_ERROR.GATEWAY_UNAUTHORIZED,
          message: error.message,
          httpStatus: 401,
        };
      }
      if (error.code === 'WHATSAPP_NOT_CONNECTED') {
        return {
          status: 'DISCONNECTED',
          code: WHATSAPP_ERROR.NOT_CONNECTED,
          message: error.message,
          httpStatus: 409,
        };
      }
      return {
        status: 'ERROR',
        code: WHATSAPP_ERROR.GATEWAY_UNAVAILABLE,
        message: error.message,
        httpStatus: 503,
      };
    }
    return {
      status: 'ERROR',
      code: WHATSAPP_ERROR.GATEWAY_UNAVAILABLE,
      message: error instanceof Error ? error.message : 'Gateway test failed',
      httpStatus: 503,
    };
  }
}
