import { isWhatsAppGroupChatId, normalizeWhatsAppGroupChatId } from '@nbos/shared';
import { assertHttpsBaseUrl } from './whatsapp-gateway.client';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';

export type WhatsAppConnectionUpsertInput = {
  baseUrl?: string;
  apiToken?: string;
  accountingGroupChatId?: string | null;
  webhookSigningSecret?: string;
  gatewayAccountId?: string | null;
};

type ConnectionRow = {
  baseUrl: string | null;
  encryptedApiToken: string | null;
  encryptedWebhookSecret: string | null;
  gatewayAccountId: string | null;
  accountingGroupChatId: string | null;
};

type SecretStore = { encryptToken: (value: string) => string };

export type WhatsAppConnectionWritePatch = {
  configuringGateway: boolean;
  tokenChanged: boolean;
  nextBaseUrl: string | null;
  data: {
    baseUrl?: string | null;
    encryptedApiToken?: string | null;
    status?: 'CONNECTED';
    lastErrorCode?: null;
    lastErrorMessage?: null;
    accountingGroupChatId: string | null;
    encryptedWebhookSecret: string | null;
    gatewayAccountId: string | null;
  };
};

export function buildWhatsAppConnectionWritePatch(
  row: ConnectionRow,
  input: WhatsAppConnectionUpsertInput,
  secrets: SecretStore,
  allowHttp: boolean,
  accountingGroupChatId: string | null,
): WhatsAppConnectionWritePatch {
  const token = input.apiToken?.trim();
  const webhook = input.webhookSigningSecret?.trim();
  const nextBaseUrl =
    input.baseUrl !== undefined ? assertHttpsBaseUrl(input.baseUrl, allowHttp) : row.baseUrl;
  const nextEncrypted = token ? secrets.encryptToken(token) : row.encryptedApiToken;
  const nextWebhookSecret = webhook ? secrets.encryptToken(webhook) : row.encryptedWebhookSecret;
  const nextGatewayAccountId =
    input.gatewayAccountId !== undefined
      ? input.gatewayAccountId?.trim() || null
      : row.gatewayAccountId;
  const configuringGateway = input.baseUrl !== undefined || Boolean(token);
  if (configuringGateway && (!nextBaseUrl || !nextEncrypted)) {
    throwWhatsAppDomainError(
      400,
      WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
      'Gateway base URL and API token are required',
    );
  }
  return {
    configuringGateway,
    tokenChanged: Boolean(token),
    nextBaseUrl,
    data: {
      ...(configuringGateway
        ? {
            baseUrl: nextBaseUrl,
            encryptedApiToken: nextEncrypted,
            status: 'CONNECTED' as const,
            lastErrorCode: null,
            lastErrorMessage: null,
          }
        : {}),
      accountingGroupChatId,
      encryptedWebhookSecret: nextWebhookSecret,
      gatewayAccountId: nextGatewayAccountId,
    },
  };
}

export function parseAccountingGroupChatId(raw: string | null): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return null;
  const normalized = normalizeWhatsAppGroupChatId(trimmed);
  if (!isWhatsAppGroupChatId(normalized)) {
    throwWhatsAppDomainError(
      400,
      WHATSAPP_ERROR.INVALID_GROUP_ID,
      'Accountant WhatsApp group ID must be a group JID (@g.us)',
    );
  }
  return normalized;
}
