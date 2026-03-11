import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * MVP: in-memory store.
 * TODO: migrate to Prisma model when Messenger tables are added to schema.
 */

interface Channel {
  id: string;
  name: string;
  projectId: string;
  type: 'project' | 'general' | 'announcement';
  createdAt: Date;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

@Injectable()
export class MessengerService {
  private readonly channels = new Map<string, Channel>();
  private readonly messages = new Map<string, Message[]>();
  private readonly directMessages = new Map<string, Message[]>();
  private readonly logger = new Logger(MessengerService.name);

  constructor() {
    this.seedData();
  }

  getChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  createChannel(name: string, projectId: string, type: Channel['type']): Channel {
    const channel: Channel = {
      id: randomUUID(),
      name,
      projectId,
      type,
      createdAt: new Date(),
    };
    this.channels.set(channel.id, channel);
    this.messages.set(channel.id, []);
    this.logger.log(`Channel created: ${name}`);
    return channel;
  }

  getMessages(channelId: string, pagination: PaginationParams = {}) {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const all = this.messages.get(channelId) ?? [];
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  sendMessage(channelId: string, senderId: string, senderName: string, content: string): Message {
    const message: Message = {
      id: randomUUID(),
      channelId,
      senderId,
      senderName,
      content,
      createdAt: new Date(),
      editedAt: null,
    };
    const existing = this.messages.get(channelId) ?? [];
    existing.push(message);
    this.messages.set(channelId, existing);
    return message;
  }

  getDirectMessages(userId1: string, userId2: string, pagination: PaginationParams = {}) {
    const key = this.dmKey(userId1, userId2);
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const all = this.directMessages.get(key) ?? [];
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  sendDirectMessage(
    senderId: string,
    senderName: string,
    recipientId: string,
    content: string,
  ): Message {
    const key = this.dmKey(senderId, recipientId);
    const message: Message = {
      id: randomUUID(),
      channelId: key,
      senderId,
      senderName,
      content,
      createdAt: new Date(),
      editedAt: null,
    };
    const existing = this.directMessages.get(key) ?? [];
    existing.push(message);
    this.directMessages.set(key, existing);
    return message;
  }

  getDirectConversations(userId: string): { recipientId: string; lastMessage: Message }[] {
    const conversations: { recipientId: string; lastMessage: Message }[] = [];

    for (const [key, msgs] of this.directMessages.entries()) {
      const [id1, id2] = key.split(':');
      if (id1 !== userId && id2 !== userId) continue;
      if (msgs.length === 0) continue;

      const recipientId = id1 === userId ? id2 : id1;
      conversations.push({ recipientId, lastMessage: msgs[msgs.length - 1] });
    }

    return conversations.sort(
      (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    );
  }

  private dmKey(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join(':');
  }

  private seedData(): void {
    const generalId = randomUUID();
    const projectId = randomUUID();
    const announcementsId = randomUUID();

    this.channels.set(generalId, {
      id: generalId,
      name: '#general',
      projectId: 'system',
      type: 'general',
      createdAt: new Date('2026-01-01'),
    });
    this.channels.set(projectId, {
      id: projectId,
      name: '#project-nbos',
      projectId: 'nbos',
      type: 'project',
      createdAt: new Date('2026-01-15'),
    });
    this.channels.set(announcementsId, {
      id: announcementsId,
      name: '#announcements',
      projectId: 'system',
      type: 'announcement',
      createdAt: new Date('2026-01-01'),
    });

    this.messages.set(projectId, []);
    this.messages.set(announcementsId, []);

    const seed: Omit<Message, 'id'>[] = [
      {
        channelId: generalId,
        senderId: 'user-1',
        senderName: 'Alex Morgan',
        content: 'Good morning everyone! Ready for the standup?',
        createdAt: new Date('2026-03-10T09:00:00'),
        editedAt: null,
      },
      {
        channelId: generalId,
        senderId: 'user-2',
        senderName: 'Sarah Chen',
        content: 'Morning! Let me grab my coffee first ☕',
        createdAt: new Date('2026-03-10T09:02:00'),
        editedAt: null,
      },
      {
        channelId: generalId,
        senderId: 'user-3',
        senderName: 'Michael Kim',
        content: 'I pushed the auth module changes. Can someone review?',
        createdAt: new Date('2026-03-10T09:15:00'),
        editedAt: null,
      },
      {
        channelId: generalId,
        senderId: 'user-4',
        senderName: 'Elena Volkov',
        content: "I'll take a look at the PR after lunch.",
        createdAt: new Date('2026-03-10T09:20:00'),
        editedAt: null,
      },
      {
        channelId: generalId,
        senderId: 'user-1',
        senderName: 'Alex Morgan',
        content: "Great teamwork! Don't forget the retro at 3pm.",
        createdAt: new Date('2026-03-10T09:25:00'),
        editedAt: null,
      },
    ];

    this.messages.set(
      generalId,
      seed.map((m) => ({ ...m, id: randomUUID() })),
    );

    this.logger.log('Messenger seeded: 3 channels, 5 messages in #general');
  }
}
