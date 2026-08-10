import { isMessengerProjectUuid } from '../access/messenger-legacy-channel-access.op';
import { buildMessengerCanonicalKey } from '../access/messenger-canonical.util';
import { orderedParticipantIds } from '../messenger-participants.util';

export type LegacyChannelType = 'PROJECT' | 'GENERAL' | 'ANNOUNCEMENT';

export type UnifiedConversationType =
  | 'PROJECT_GENERAL'
  | 'PRODUCT'
  | 'DEAL'
  | 'TASK'
  | 'DIRECT'
  | 'INTERNAL_GROUP';

export type MessengerLegacyBackfillChannelPlan = {
  conversationId: string;
  type: UnifiedConversationType;
  title: string;
  canonicalKey: string;
  /** Only when PROJECT + real Project UUID and PRIMARY is available. */
  primaryProjectId: string | null;
  /** RELATED project link when PRIMARY already claimed. */
  relatedProjectId: string | null;
  metadata: {
    legacySource: 'channel';
    legacyChannelType: LegacyChannelType;
    legacyProjectId: string;
  };
};

export type MessengerLegacyBackfillDirectPlan = {
  conversationId: string;
  type: 'DIRECT';
  title: null;
  canonicalKey: string;
  directParticipantLowId: string;
  directParticipantHighId: string;
  metadata: { legacySource: 'direct_thread' };
};

/** Stable idempotent conversation id = legacy channel id. */
export function legacyChannelConversationId(channelId: string): string {
  return channelId;
}

/** Stable idempotent conversation id = legacy DM thread id. */
export function legacyDirectConversationId(threadId: string): string {
  return threadId;
}

export function legacyChannelCanonicalKey(channelId: string): string {
  return `legacy_channel:${channelId}`;
}

/**
 * Map a legacy channel into unified conversation fields.
 * Does not invent Product/Deal/Task chats.
 * PROJECT + UUID projectId → PROJECT_GENERAL with optional PRIMARY/RELATED link.
 * Otherwise → INTERNAL_GROUP (org / transitional logical project keys).
 */
export function planLegacyChannelConversation(input: {
  channelId: string;
  name: string;
  projectId: string;
  type: LegacyChannelType;
  /** Project ids that already have a PRIMARY messenger link (or will in this run). */
  primaryProjectIdsClaimed: ReadonlySet<string>;
  /** When true, `projectId` exists in `projects` table. */
  projectExists: boolean;
}): MessengerLegacyBackfillChannelPlan {
  const conversationId = legacyChannelConversationId(input.channelId);
  const baseMeta = {
    legacySource: 'channel' as const,
    legacyChannelType: input.type,
    legacyProjectId: input.projectId,
  };

  const canPrimaryProject =
    input.type === 'PROJECT' &&
    isMessengerProjectUuid(input.projectId) &&
    input.projectExists;

  if (canPrimaryProject) {
    const alreadyClaimed = input.primaryProjectIdsClaimed.has(input.projectId);
    return {
      conversationId,
      type: alreadyClaimed ? 'INTERNAL_GROUP' : 'PROJECT_GENERAL',
      title: input.name,
      canonicalKey: alreadyClaimed
        ? legacyChannelCanonicalKey(input.channelId)
        : buildMessengerCanonicalKey('PROJECT_GENERAL', input.projectId),
      primaryProjectId: alreadyClaimed ? null : input.projectId,
      relatedProjectId: alreadyClaimed ? input.projectId : null,
      metadata: baseMeta,
    };
  }

  return {
    conversationId,
    type: 'INTERNAL_GROUP',
    title: input.name,
    canonicalKey: legacyChannelCanonicalKey(input.channelId),
    primaryProjectId: null,
    relatedProjectId: null,
    metadata: baseMeta,
  };
}

export function planLegacyDirectConversation(input: {
  threadId: string;
  participantAId: string;
  participantBId: string;
}): MessengerLegacyBackfillDirectPlan {
  const [low, high] = orderedParticipantIds(input.participantAId, input.participantBId);
  return {
    conversationId: legacyDirectConversationId(input.threadId),
    type: 'DIRECT',
    title: null,
    canonicalKey: buildMessengerCanonicalKey('DIRECT', low, high),
    directParticipantLowId: low,
    directParticipantHighId: high,
    metadata: { legacySource: 'direct_thread' },
  };
}
