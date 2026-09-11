import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { shouldStartPublicHttpApi } from '../../runtime/process-role';
import { mapCoreMessage } from './core/messenger-core-message-map';
import type { MessengerDeliveryStatusEvent } from './core/messenger-delivery-status.types';
import { MessengerDeliveryStatusBus } from './core/messenger-delivery-status-bus';
import { MessengerGateway } from './messenger.gateway';

@Injectable()
export class MessengerDeliveryStatusSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessengerDeliveryStatusSubscriber.name);
  private unsubscribe: (() => void) | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly bus: MessengerDeliveryStatusBus,
    private readonly gateway: MessengerGateway,
  ) {}

  onModuleInit(): void {
    if (!shouldStartPublicHttpApi()) return;
    this.unsubscribe = this.bus.subscribe((event) => {
      void this.onDeliveryEvent(event).catch((error: unknown) => {
        this.logger.warn(
          `Messenger delivery status emit failed (${error instanceof Error ? error.name : 'error'})`,
        );
      });
    });
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async onDeliveryEvent(event: MessengerDeliveryStatusEvent): Promise<void> {
    const message = await this.prisma.messengerMessage.findUnique({
      where: { id: event.messageId },
      include: {
        attachments: true,
        mentions: true,
        referencesAsTarget: true,
        conversation: { select: { zone: true } },
      },
    });
    if (!message || message.conversation.zone !== 'CLIENT') return;
    if (message.conversationId !== event.conversationId) return;
    this.gateway.emitCoreConversationMessage(message.conversationId, mapCoreMessage(message));
  }
}
