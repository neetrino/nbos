import { Injectable, Logger } from '@nestjs/common';
import {
  WHATSAPP_GATEWAY_CONNECT_TIMEOUT_MS,
  WHATSAPP_GATEWAY_REQUEST_TIMEOUT_MS,
} from './whatsapp-gateway.constants';
import { WhatsAppGatewayHttpError } from './whatsapp-gateway.errors';
import type {
  WhatsAppGatewayAddParticipantsResult,
  WhatsAppGatewayChatsListData,
  WhatsAppGatewayChatType,
  WhatsAppGatewayCreateGroupResult,
  WhatsAppGatewayEnvelope,
  WhatsAppGatewayGroupsListData,
  WhatsAppGatewayHealthData,
  WhatsAppGatewayInviteLinkResult,
  WhatsAppGatewayParticipant,
  WhatsAppGatewaySendMessageResult,
} from './whatsapp-gateway.types';

export interface WhatsAppGatewayClientConfig {
  baseUrl: string;
  apiToken: string;
}

/**
 * Thin typed HTTP client for WhatsApp Gateway. Never logs tokens, invite URLs, JIDs, or message bodies.
 */
@Injectable()
export class WhatsAppGatewayClient {
  private readonly logger = new Logger(WhatsAppGatewayClient.name);

  async health(config: WhatsAppGatewayClientConfig): Promise<WhatsAppGatewayHealthData> {
    const data = await this.request<WhatsAppGatewayHealthData>(config, 'GET', '/health', {
      auth: false,
    });
    return data;
  }

  async listGroups(
    config: WhatsAppGatewayClientConfig,
    params?: { limit?: number; offset?: number; search?: string },
  ): Promise<WhatsAppGatewayGroupsListData> {
    const query = new URLSearchParams();
    query.set('limit', String(params?.limit ?? 100));
    query.set('offset', String(params?.offset ?? 0));
    if (params?.search?.trim()) {
      query.set('search', params.search.trim().slice(0, 100));
    }
    return this.request(config, 'GET', `/api/groups?${query.toString()}`);
  }

  async listChats(
    config: WhatsAppGatewayClientConfig,
    params?: { limit?: number; offset?: number; search?: string },
  ): Promise<WhatsAppGatewayChatsListData> {
    const limit = params?.limit ?? 100;
    const offset = params?.offset ?? 0;
    const query = new URLSearchParams();
    query.set('limit', String(limit));
    query.set('offset', String(offset));
    query.set('search', params?.search?.trim().slice(0, 100) ?? '');
    const data = await this.request<WhatsAppGatewayChatsListData>(
      config,
      'GET',
      `/api/chats?${query.toString()}`,
    );
    return normalizeChatsPage(data, limit, offset);
  }

  async createGroup(
    config: WhatsAppGatewayClientConfig,
    body: { name: string; participants: string[] },
    idempotencyKey: string,
  ): Promise<WhatsAppGatewayCreateGroupResult> {
    return this.request(config, 'POST', '/api/groups', {
      body,
      idempotencyKey,
    });
  }

  async getGroup(
    config: WhatsAppGatewayClientConfig,
    groupId: string,
  ): Promise<WhatsAppGatewayCreateGroupResult> {
    return this.request(config, 'GET', `/api/groups/${encodeURIComponent(groupId)}`);
  }

  async refreshGroups(config: WhatsAppGatewayClientConfig): Promise<{ refreshed: boolean }> {
    return this.request(config, 'POST', '/api/groups/refresh');
  }

  async listParticipants(
    config: WhatsAppGatewayClientConfig,
    groupId: string,
  ): Promise<WhatsAppGatewayParticipant[]> {
    const data = await this.request<
      { participants?: WhatsAppGatewayParticipant[] } | WhatsAppGatewayParticipant[]
    >(config, 'GET', `/api/groups/${encodeURIComponent(groupId)}/participants`);
    return Array.isArray(data) ? data : (data.participants ?? []);
  }

  async addParticipants(
    config: WhatsAppGatewayClientConfig,
    groupId: string,
    participants: string[],
    idempotencyKey: string,
  ): Promise<WhatsAppGatewayAddParticipantsResult> {
    return this.request(config, 'POST', `/api/groups/${encodeURIComponent(groupId)}/participants`, {
      body: { participants },
      idempotencyKey,
    });
  }

  async getInviteLink(
    config: WhatsAppGatewayClientConfig,
    groupId: string,
  ): Promise<WhatsAppGatewayInviteLinkResult> {
    return this.request(config, 'GET', `/api/groups/${encodeURIComponent(groupId)}/invite-link`);
  }

  async sendTextMessage(
    config: WhatsAppGatewayClientConfig,
    body: { chatId: string; text: string },
    idempotencyKey?: string,
  ): Promise<WhatsAppGatewaySendMessageResult> {
    return this.request(config, 'POST', '/api/messages/send', { body, idempotencyKey });
  }

  private async request<T>(
    config: WhatsAppGatewayClientConfig,
    method: string,
    path: string,
    options?: {
      body?: unknown;
      idempotencyKey?: string;
      auth?: boolean;
    },
  ): Promise<T> {
    const base = config.baseUrl.replace(/\/+$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (options?.auth !== false) {
      headers.Authorization = `Bearer ${config.apiToken}`;
    }
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WHATSAPP_GATEWAY_REQUEST_TIMEOUT_MS);

    try {
      this.logger.debug(`WhatsApp Gateway ${method} ${path}`);
      const response = await fetch(url, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      let envelope: WhatsAppGatewayEnvelope<T> | null = null;
      try {
        envelope = (await response.json()) as WhatsAppGatewayEnvelope<T>;
      } catch {
        envelope = null;
      }

      if (!response.ok || !envelope?.success) {
        const code = envelope?.error?.code ?? `HTTP_${response.status}`;
        const message =
          envelope?.error?.message ?? `WhatsApp Gateway request failed (${response.status})`;
        throw new WhatsAppGatewayHttpError(
          response.status,
          code,
          message,
          envelope?.error?.requestId,
        );
      }

      return envelope.data as T;
    } catch (error) {
      if (error instanceof WhatsAppGatewayHttpError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WhatsAppGatewayHttpError(
          503,
          'WAHA_UNAVAILABLE',
          'WhatsApp Gateway request timed out',
        );
      }
      throw new WhatsAppGatewayHttpError(
        503,
        'WAHA_UNAVAILABLE',
        error instanceof Error ? error.message : 'WhatsApp Gateway unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function assertHttpsBaseUrl(baseUrl: string, allowHttpLocalhost: boolean): string {
  const normalized = baseUrl.trim();
  let endIndex = normalized.length;
  while (endIndex > 0 && normalized.charCodeAt(endIndex - 1) === 47) {
    endIndex -= 1;
  }
  const trimmed = normalized.slice(0, endIndex);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new WhatsAppGatewayHttpError(400, 'VALIDATION_ERROR', 'Invalid Gateway base URL');
  }
  const isLocal =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
  if (parsed.protocol === 'https:') {
    return trimmed;
  }
  if (parsed.protocol === 'http:' && allowHttpLocalhost && isLocal) {
    return trimmed;
  }
  throw new WhatsAppGatewayHttpError(
    400,
    'VALIDATION_ERROR',
    'Gateway base URL must use HTTPS (HTTP allowed only for localhost in non-production)',
  );
}

export function normalizeGatewayChatType(id: string, type?: string): WhatsAppGatewayChatType {
  if (type === 'group' || type === 'direct') return type;
  return id.endsWith('@g.us') ? 'group' : 'direct';
}

function normalizeChatsPage(
  data: WhatsAppGatewayChatsListData | undefined,
  limit: number,
  offset: number,
): WhatsAppGatewayChatsListData {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items.map((item) => ({
      id: item.id,
      name: typeof item.name === 'string' ? item.name : '',
      type: normalizeGatewayChatType(item.id, item.type),
    })),
    pagination: {
      limit: data?.pagination?.limit ?? limit,
      offset: data?.pagination?.offset ?? offset,
      count: data?.pagination?.count ?? items.length,
    },
  };
}

export { WHATSAPP_GATEWAY_CONNECT_TIMEOUT_MS };
