import { CAPABILITY_VERSION_1 } from './capability-catalog.read';
import {
  AI_CONVERSATION_RESOURCE_TYPE,
  AI_MESSENGER_DRAFT_CAPABILITY_KEY,
  AI_MESSENGER_SEND_CAPABILITY_KEY,
} from './customer-facing-types';
import type { AiCapabilityDefinition, AiScopeType } from './capability-types';

const CONVERSATION_SCOPES: readonly AiScopeType[] = ['RESOURCE'];

/**
 * Customer-facing draft vs send. Canon names `messenger.reply.draft` /
 * `messenger.reply.send` map onto the one-dot registry keys below.
 *
 * Registered so grants can be distinct. Phase 1 does not dispatch a Messenger
 * auto-send runtime — External Agent REST/MCP and the Domain Action Gateway
 * have no handler for these keys.
 */
export const AI_CUSTOMER_FACING_CAPABILITIES: readonly AiCapabilityDefinition[] = [
  {
    key: AI_MESSENGER_DRAFT_CAPABILITY_KEY,
    version: CAPABILITY_VERSION_1,
    module: 'Messenger',
    description:
      'Prepare a customer-facing reply draft. Does not send. Customer text is untrusted.',
    access: 'WRITE',
    risk: 'MEDIUM',
    allowedScopeTypes: CONVERSATION_SCOPES,
    input: {
      id: 'messenger.reply_draft.input.v1',
      fields: ['conversationId', 'customerId', 'body'],
    },
    output: {
      id: 'messenger.reply_draft.output.v1',
      fields: ['draftId', 'conversationId', 'createdAt'],
    },
    idempotency: 'REQUIRED',
    audit: 'ALWAYS',
    approval: 'NONE',
    rateLimitClass: 'WRITE_STANDARD',
    maxDataClassification: 'INTERNAL',
    requiresTargetDataClassification: true,
    deprecated: false,
  },
  {
    key: AI_MESSENGER_SEND_CAPABILITY_KEY,
    version: CAPABILITY_VERSION_1,
    module: 'Messenger',
    description:
      'Send a customer-facing reply. Separate from draft. Default path is approval, not auto-send.',
    access: 'WRITE',
    risk: 'HIGH',
    allowedScopeTypes: CONVERSATION_SCOPES,
    input: {
      id: 'messenger.reply_send.input.v1',
      fields: ['conversationId', 'customerId', 'body'],
    },
    output: {
      id: 'messenger.reply_send.output.v1',
      fields: ['messageId', 'conversationId', 'createdAt'],
    },
    idempotency: 'REQUIRED',
    audit: 'ALWAYS',
    approval: 'REQUIRED',
    rateLimitClass: 'WRITE_SENSITIVE',
    maxDataClassification: 'INTERNAL',
    requiresTargetDataClassification: true,
    deprecated: false,
  },
];

export const AI_CUSTOMER_FACING_RESOURCE_TYPE = AI_CONVERSATION_RESOURCE_TYPE;
