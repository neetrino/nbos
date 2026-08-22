import type { ActorChannelSource } from '../actor';
import type { AiContextTrustLevel } from './context-types';

export const AI_CUSTOMER_FACING_MODES = [
  'DRAFT_ONLY',
  'APPROVAL_REQUIRED',
  'AUTO_SEND_ALLOWED',
] as const;

export type AiCustomerFacingMode = (typeof AI_CUSTOMER_FACING_MODES)[number];

export const AI_CUSTOMER_FACING_ACTIONS = ['draft', 'send', 'escalate'] as const;

export type AiCustomerFacingAction = (typeof AI_CUSTOMER_FACING_ACTIONS)[number];

export const AI_CUSTOMER_CONTENT_VISIBILITY = ['INTERNAL_ONLY', 'CUSTOMER_VISIBLE'] as const;

export type AiCustomerContentVisibility = (typeof AI_CUSTOMER_CONTENT_VISIBILITY)[number];

export const AI_CUSTOMER_ESCALATION_REASONS = [
  'OUTSIDE_CAPABILITY',
  'LEGAL_COMMITMENT',
  'FINANCIAL_PROMISE',
  'IDENTITY_VERIFICATION',
  'SENSITIVE_TOPIC',
  'MISSING_DATA',
  'EXECUTION_FAILURE',
  'QUALITY_GATE',
] as const;

export type AiCustomerEscalationReason = (typeof AI_CUSTOMER_ESCALATION_REASONS)[number];

/** Conversation/customer scope. Missing fields never authorize. */
export interface AiCustomerConversationScope {
  channel: ActorChannelSource;
  conversationId: string;
  customerId: string;
  organizationId?: string | null;
}

export const AI_CUSTOMER_MESSAGE_TRUST: AiContextTrustLevel = 'UNTRUSTED_CONTENT';

export const AI_MESSENGER_DRAFT_CAPABILITY_KEY = 'messenger.reply_draft';
export const AI_MESSENGER_SEND_CAPABILITY_KEY = 'messenger.reply_send';

export const AI_CONVERSATION_RESOURCE_TYPE = 'CONVERSATION';

export function isAiCustomerFacingMode(value: string): value is AiCustomerFacingMode {
  return (AI_CUSTOMER_FACING_MODES as readonly string[]).includes(value);
}

export function isAiCustomerFacingAction(value: string): value is AiCustomerFacingAction {
  return (AI_CUSTOMER_FACING_ACTIONS as readonly string[]).includes(value);
}
