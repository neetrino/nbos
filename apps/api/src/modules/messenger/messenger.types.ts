import type { MessengerChannelTypeApi } from './messenger-channel-type.util';

export interface MessengerChannelDto {
  id: string;
  name: string;
  projectId: string;
  type: MessengerChannelTypeApi;
  createdAt: Date;
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
