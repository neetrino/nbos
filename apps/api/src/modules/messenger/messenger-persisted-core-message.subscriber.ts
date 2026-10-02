import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { shouldStartPublicHttpApi } from '../../runtime/process-role';
import { mapCoreMessage } from './core/messenger-core-message-map';
import {
  MessengerPersistedCoreMessageBus,
  type MessengerPersistedCoreMessageEvent,
} from './core/messenger-persisted-core-message-bus';
import { MessengerGateway } from './messenger.gateway';

/**
 * API-side fan-out for Finance reminders persisted in the worker.
 * Reloads the canonical row so the published status is the stored status.
 */
@Injectable()
export class MessengerPersistedCoreMessageSubscriber implements OnModuleInit, OnModuleDestroy {
  private unsubscribe: (() => void) | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly bus: MessengerPersistedCoreMessageBus,
    private readonly gateway: MessengerGateway,
  ) {}

  onModuleInit(): void {
    if (!shouldStartPublicHttpApi()) return;
    this.unsubscribe = this.bus.subscribe((event) => this.publishLoaded(event));
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async publishLoaded(event: MessengerPersistedCoreMessageEvent): Promise<void> {
    const message = await this.loadClientMessage(event);
    if (!message) return;
    this.gateway.publishPersistedCoreMessage(mapCoreMessage(message));
  }

  private async loadClientMessage(event: MessengerPersistedCoreMessageEvent) {
    const message = await this.prisma.messengerMessage.findUnique({
      where: { id: event.messageId },
      include: {
        attachments: true,
        mentions: true,
        referencesAsTarget: true,
        conversation: { select: { zone: true } },
      },
    });
    if (!message || message.conversation.zone !== 'CLIENT') return null;
    if (message.conversationId !== event.conversationId) return null;
    return message;
  }
}
