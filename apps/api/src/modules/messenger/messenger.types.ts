import type { MessengerChannelTypeApi } from './messenger-channel-type.util';

export interface MessengerChannelDto {
  id: string;
  name: string;
  projectId: string;
  type: MessengerChannelTypeApi;
  createdAt: Date;
  /** Messages from others after this viewer's read cursor (0 if fully caught up). */
  unreadCount: number;
}

export interface MessengerMessageDto {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface MessengerDmConversationDto {
  recipientId: string;
  lastMessage: MessengerMessageDto;
  unreadCount: number;
}
