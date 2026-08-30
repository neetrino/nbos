export interface WhatsAppGatewayHealthData {
  gateway: string;
  database?: string;
  waha?: string;
}

export interface WhatsAppGatewayGroupSummary {
  id: string;
  name: string;
  participantCount?: number | null;
  pictureUrl?: string | null;
}

export interface WhatsAppGatewayGroupsListData {
  groups: WhatsAppGatewayGroupSummary[];
  pagination: { limit: number; offset: number; count: number };
}

export type WhatsAppGatewayChatType = 'group' | 'direct';

export interface WhatsAppGatewayChatSummary {
  id: string;
  name: string;
  type: WhatsAppGatewayChatType;
}

export interface WhatsAppGatewayChatsListData {
  items: WhatsAppGatewayChatSummary[];
  pagination: { limit: number; offset: number; count: number };
}

export interface WhatsAppGatewayCreateGroupResult {
  id: string;
  name: string;
}

export interface WhatsAppGatewayParticipant {
  id: string;
  phone?: string | null;
  role?: string;
}

export interface WhatsAppGatewayAddParticipantsResult {
  groupId: string;
  status: string;
  added: string[];
  alreadyMembers: string[];
  failed: Array<{ id?: string; code?: string; message?: string }>;
}

export interface WhatsAppGatewayInviteLinkResult {
  groupId: string;
  inviteUrl: string;
}

export interface WhatsAppGatewaySendMessageResult {
  requestId?: string;
  messageId?: string;
  chatId: string;
  status: string;
  sentAt?: string;
}

export interface WhatsAppGatewayEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string; requestId?: string };
}

export interface WhatsAppConnectionPublicView {
  configured: boolean;
  baseUrl: string | null;
  hasToken: boolean;
  status: string;
  lastHealthCheckAt: string | null;
  lastConnectedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  accountingGroupChatId: string | null;
}

export type ProductWhatsAppEnsureSource =
  | 'PRODUCT_CREATED'
  | 'DEAL_ACTION'
  | 'DEAL_WON'
  | 'EARLY_DELIVERY'
  | 'RECONCILIATION'
  | 'MANUAL_RETRY'
  | 'DEVELOPMENT_TS'
  | 'MANUAL_BIND'
  | 'MANUAL_SYNC'
  | 'MANUAL_INVITE';

export interface EnsureProductWhatsAppGroupInput {
  source: ProductWhatsAppEnsureSource;
  contextDealId?: string | null;
  actorId?: string | null;
}

export interface ProductWhatsAppParticipantCandidate {
  employeeId: string;
  jid: string;
  roles: string[];
}

export interface ProductWhatsAppParticipantWarning {
  employeeId?: string | null;
  role: string;
  code: string;
  message: string;
}
