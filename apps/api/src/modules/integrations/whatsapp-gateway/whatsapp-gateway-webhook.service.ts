import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { MessengerGateway } from '../../messenger/messenger.gateway';
import { persistWhatsAppInboundMessage } from '../../messenger/core/messenger-wa-inbound.ops';
import {
  applyWhatsAppAck,
  applyWhatsAppEdit,
  applyWhatsAppReactionEvent,
  applyWhatsAppRevoke,
} from '../../messenger/core/messenger-wa-lifecycle.ops';
import {
  isRetryableWhatsAppLifecycleSkip,
  isWhatsAppInboundEventType,
} from '../../messenger/core/messenger-wa-identity';
import {
  claimWhatsAppProviderEvent,
  markWhatsAppProviderEvent,
} from '../../messenger/core/messenger-wa-provider-event.ops';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';
import { verifyWhatsAppGatewayWebhook } from './whatsapp-gateway-webhook.hmac';
import {
  normalizeWhatsAppWebhookBody,
  type WhatsAppGatewayWebhookBody,
} from './whatsapp-gateway-webhook.types';
import type { MessengerCoreMessageDto } from '../../messenger/core/messenger-core.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

@Injectable()
export class WhatsAppGatewayWebhookService {
  private readonly logger = new Logger(WhatsAppGatewayWebhookService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connection: WhatsAppGatewayConnectionService,
    private readonly messengerGateway: MessengerGateway,
  ) {}

  async handleWebhook(
    rawBody: Buffer | undefined,
    headers: {
      eventId: string | undefined;
      timestamp: string | undefined;
      signature: string | undefined;
      algorithm: string | undefined;
    },
    body: WhatsAppGatewayWebhookBody,
  ): Promise<{ received: true }> {
    const secret = await this.connection.requireWebhookSigningSecret();
    if (!rawBody) {
      throw new UnauthorizedException({ code: WHATSAPP_ERROR.WEBHOOK_INVALID_SIGNATURE });
    }
    const verified = verifyWhatsAppGatewayWebhook({
      rawBody,
      headers,
      signingSecret: secret,
    });
    if (!verified.ok) {
      throw unauthorizedFor(verified.reason);
    }
    const event = normalizeWhatsAppWebhookBody(body);
    if (!event || event.eventId !== headers.eventId) {
      throw new UnauthorizedException({ code: WHATSAPP_ERROR.WEBHOOK_INVALID_SIGNATURE });
    }
    await this.persistAndDispatch(event);
    return { received: true };
  }

  private async persistAndDispatch(
    event: NonNullable<ReturnType<typeof normalizeWhatsAppWebhookBody>>,
  ) {
    const claimed = await claimWhatsAppProviderEvent(this.prisma, event);
    if (!claimed.dispatch) return;
    try {
      await settleWhatsAppWebhookDispatch(this.prisma, claimed.id, event, (message) => {
        this.messengerGateway.emitCoreConversationMessage(message.conversationId, message);
      });
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) {
        this.logger.error(`WhatsApp webhook dispatch failed eventType=${event.type}`);
      }
      throw error;
    }
  }
}

async function settleWhatsAppWebhookDispatch(
  prisma: PrismaLike,
  claimedId: string,
  event: NonNullable<ReturnType<typeof normalizeWhatsAppWebhookBody>>,
  emit: (message: MessengerCoreMessageDto) => void,
): Promise<void> {
  const handled = await dispatchWhatsAppEvent(prisma, event);
  if (isRetryableWhatsAppLifecycleSkip(handled.skipReason)) {
    throwWhatsAppDomainError(
      503,
      WHATSAPP_ERROR.WEBHOOK_MESSAGE_NOT_READY,
      'WhatsApp delivery event arrived before the Core message mapping',
    );
  }
  await markWhatsAppProviderEvent(prisma, claimedId, handled);
  if (handled.message) emit(handled.message);
}

function unauthorizedFor(reason: 'SIGNATURE' | 'REPLAY' | 'ALGORITHM' | 'TIMESTAMP') {
  if (reason === 'REPLAY' || reason === 'TIMESTAMP') {
    return new UnauthorizedException({ code: WHATSAPP_ERROR.WEBHOOK_REPLAY });
  }
  return new UnauthorizedException({ code: WHATSAPP_ERROR.WEBHOOK_INVALID_SIGNATURE });
}

async function dispatchWhatsAppEvent(
  prisma: PrismaLike,
  event: NonNullable<ReturnType<typeof normalizeWhatsAppWebhookBody>>,
) {
  if (!isWhatsAppInboundEventType(event.type)) {
    return {
      message: null,
      skipReason: 'UNSUPPORTED_EVENT',
      conversationId: '',
      messageId: undefined,
    };
  }
  if (event.type === 'message.received') {
    const persisted = await persistWhatsAppInboundMessage(prisma, {
      accountId: event.accountId,
      chatId: event.chatId ?? '',
      providerMessageId: event.providerMessageId ?? event.eventId,
      body: event.body,
      senderName: event.senderName,
      fromMe: event.fromMe,
      createdAt: event.occurredAt,
      title: event.chatName,
    });
    return {
      message: persisted.message,
      skipReason: persisted.skipReason,
      conversationId: persisted.conversationId,
      messageId: persisted.message?.id,
    };
  }
  return dispatchWhatsAppLifecycle(prisma, event);
}

async function dispatchWhatsAppLifecycle(
  prisma: PrismaLike,
  event: NonNullable<ReturnType<typeof normalizeWhatsAppWebhookBody>>,
) {
  if (event.type === 'session.status') {
    return { message: null, skipReason: null, conversationId: '', messageId: undefined };
  }
  if (event.type === 'message.reaction') {
    const reaction = await applyWhatsAppReactionEvent();
    return {
      message: null,
      skipReason: reaction.skipReason,
      conversationId: '',
      messageId: undefined,
    };
  }
  if (!event.providerMessageId) {
    return {
      message: null,
      skipReason: 'MISSING_MESSAGE_ID',
      conversationId: '',
      messageId: undefined,
    };
  }
  if (event.type === 'message.ack') {
    const ack = await applyWhatsAppAck(prisma, {
      accountId: event.accountId,
      providerMessageId: event.providerMessageId,
      ack: event.ack,
    });
    return lifecycleHandled(ack);
  }
  if (event.type === 'message.edited') {
    const edited = await applyWhatsAppEdit(prisma, {
      accountId: event.accountId,
      providerMessageId: event.providerMessageId,
      body: event.body,
      editedAt: event.occurredAt,
    });
    return lifecycleHandled(edited);
  }
  const revoked = await applyWhatsAppRevoke(prisma, {
    accountId: event.accountId,
    providerMessageId: event.providerMessageId,
    revokedAt: event.occurredAt,
  });
  return lifecycleHandled(revoked);
}

function lifecycleHandled(result: {
  message: MessengerCoreMessageDto | null;
  skipReason: string | null;
}) {
  return {
    message: result.message,
    skipReason: result.skipReason,
    conversationId: result.message?.conversationId ?? '',
    messageId: result.message?.id,
  };
}
