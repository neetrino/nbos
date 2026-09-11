import type {
  MessengerConversationType,
  MessengerConversationZone,
  MessengerParticipantRole,
} from '@nbos/database';
import type { MessengerRbacScope } from '../access/messenger-legacy-channel-access.op';

export const MESSENGER_CONVERSATION_GRANT_RESOURCE_TYPE = 'messenger_conversation' as const;

export const MESSENGER_CORE_AUDIT_PARTICIPANT_GRANTED =
  'messenger.conversation.participant.granted' as const;
export const MESSENGER_CORE_AUDIT_PARTICIPANT_REVOKED =
  'messenger.conversation.participant.revoked' as const;
export const MESSENGER_CORE_AUDIT_OVERRIDE_GRANTED =
  'messenger.conversation.access_override.granted' as const;
export const MESSENGER_CORE_AUDIT_OVERRIDE_REVOKED =
  'messenger.conversation.access_override.revoked' as const;

export type MessengerCoreAccessFacts = {
  conversationId: string;
  zone: MessengerConversationZone;
  conversationType?: MessengerConversationType;
  viewScope: MessengerRbacScope;
  editScope: MessengerRbacScope;
  clientReadScope: MessengerRbacScope;
  clientSendScope: MessengerRbacScope;
  isActiveParticipant: boolean;
  participantRole: MessengerParticipantRole | null;
  grantLevel: 'VIEW' | 'EDIT' | null;
};

export type MessengerCoreSendDenial = 'NO_READ' | 'NO_SEND' | 'READ_ONLY' | 'DISABLED' | null;

export type MessengerCoreAccessDecision = {
  canRead: boolean;
  canWrite: boolean;
  canSend: boolean;
  sendDeniedBecause: MessengerCoreSendDenial;
};
