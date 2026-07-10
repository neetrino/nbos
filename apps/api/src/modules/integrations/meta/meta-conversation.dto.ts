export interface MetaConversationApiDto {
  platform: 'INSTAGRAM' | 'FACEBOOK';
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  latestMessagePreview: string | null;
  lastMessageAt: string | null;
}

type MetaConversationWithSender = {
  platform?: never;
  latestMessagePreview: string | null;
  lastMessageAt: Date | null;
  senderIdentity: {
    platform: 'INSTAGRAM' | 'FACEBOOK';
    displayName: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
};

export function mapMetaConversationForLead(
  conversation: MetaConversationWithSender | null | undefined,
): MetaConversationApiDto | null {
  if (!conversation) {
    return null;
  }
  const sender = conversation.senderIdentity;
  return {
    platform: sender.platform,
    displayName: sender.displayName,
    username: sender.username,
    firstName: sender.firstName,
    lastName: sender.lastName,
    profilePictureUrl: sender.profilePictureUrl,
    latestMessagePreview: conversation.latestMessagePreview,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
  };
}

export const metaConversationLeadInclude = {
  metaConversation: {
    select: {
      latestMessagePreview: true,
      lastMessageAt: true,
      senderIdentity: {
        select: {
          platform: true,
          displayName: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePictureUrl: true,
        },
      },
    },
  },
} as const;
