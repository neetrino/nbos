import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { loadMessengerLegacyAccess } from '../access/messenger-legacy-channel-access.op';
import {
  MESSENGER_CORE_CLIENT_ATTENTION_FORBIDDEN,
  MESSENGER_CORE_CLIENT_INTERNAL_ZONE_FORBIDDEN,
  MESSENGER_CORE_CLIENT_INVITE_ROLE,
  MESSENGER_CORE_CLIENT_SEND_FORBIDDEN,
  MESSENGER_CORE_CLIENT_ZONE,
} from './messenger-core.constants';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import { listAccessibleClientConversations } from './messenger-core-client-list.ops';
import type {
  MessengerClientConversationDetail,
  MessengerClientListQuery,
  MessengerClientListResult,
  MessengerClientMessagePage,
} from './messenger-core-client.types';
import { toggleClientFavorite } from './messenger-core-favorites.ops';
import { listCoreConversationMessages } from './messenger-core-internal-messages.ops';
import { listCoreConversationLinks } from './messenger-core-link.ops';
import { mapAllMetaSalesToCore } from './messenger-meta-mapper.ops';
import { MessengerCoreService } from './messenger-core.service';
import type {
  MessengerCoreMessageDto,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';
import { defaultTaskLinksFromPrimary } from './messenger-core-task-default-links';
import { listConversationAttentions } from './messenger-core-attention.ops';
import { assignConversationAttention } from './messenger-core-attention-assign.ops';
import type { AssignConversationAttentionInput } from './messenger-core-attention-assign.ops';
import type { MessengerAttentionDto } from './messenger-core-attention.types';

@Injectable()
export class MessengerCoreClientService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly core: MessengerCoreService,
  ) {}

  async mapMetaSales(): Promise<ReturnType<typeof mapAllMetaSalesToCore>> {
    return mapAllMetaSalesToCore(this.prisma);
  }

  async listConversations(
    employeeId: string,
    query: MessengerClientListQuery,
  ): Promise<MessengerClientListResult> {
    const access = await this.requireView(employeeId);
    return listAccessibleClientConversations(
      this.prisma,
      employeeId,
      access.clientReadScope,
      access.clientSendScope,
      query,
    );
  }

  async getConversation(
    conversationId: string,
    employeeId: string,
  ): Promise<MessengerClientConversationDetail> {
    const conversation = await this.core.getConversation(conversationId, employeeId);
    this.assertClientSurface(conversation.zone);
    const loaded = await loadMessengerCoreAccessFacts(this.prisma, employeeId, conversationId);
    const decision = loaded.facts
      ? evaluateMessengerCoreAccess(loaded.facts)
      : { canSend: false, canWrite: false };
    const links = await listCoreConversationLinks(this.prisma, conversationId);
    const mapping = await this.prisma.messengerExternalConversationMapping.findFirst({
      where: { conversationId },
      select: { provider: true },
    });
    const attention = await listConversationAttentions(this.prisma, conversationId);
    return {
      ...conversation,
      canSend: decision.canSend,
      canWrite: decision.canWrite,
      provider: mapping?.provider ?? null,
      primaryLinks: defaultTaskLinksFromPrimary(links),
      attention,
    };
  }

  async listMessages(
    conversationId: string,
    employeeId: string,
    query: { before?: string; pageSize?: number },
  ): Promise<MessengerClientMessagePage> {
    await this.getConversation(conversationId, employeeId);
    return listCoreConversationMessages(this.prisma, conversationId, query);
  }

  async persistMessage(input: PersistMessengerCoreMessageInput): Promise<MessengerCoreMessageDto> {
    const senderId = input.senderId;
    if (!senderId) {
      throw new ForbiddenException(MESSENGER_CORE_CLIENT_SEND_FORBIDDEN);
    }
    await this.getConversation(input.conversationId, senderId);
    return this.core.persistAndBroadcast({
      ...input,
      direction: input.direction ?? 'OUTBOUND',
      provenance: input.provenance ?? 'EMPLOYEE',
    });
  }

  async markRead(conversationId: string, employeeId: string): Promise<void> {
    await this.getConversation(conversationId, employeeId);
    return this.core.markRead(conversationId, employeeId);
  }

  async toggleFavorite(conversationId: string, employeeId: string) {
    await this.getConversation(conversationId, employeeId);
    return toggleClientFavorite(this.prisma, employeeId, conversationId);
  }

  async inviteReadOnly(conversationId: string, actorId: string, employeeId: string) {
    await this.getConversation(conversationId, actorId);
    return this.core.inviteParticipant(
      conversationId,
      actorId,
      employeeId,
      MESSENGER_CORE_CLIENT_INVITE_ROLE,
    );
  }

  async assignAttention(
    conversationId: string,
    actorId: string,
    input: Omit<AssignConversationAttentionInput, 'conversationId' | 'assignedById'>,
  ): Promise<MessengerAttentionDto[]> {
    const conversation = await this.getConversation(conversationId, actorId);
    if (!conversation.canSend && !conversation.canWrite) {
      throw new ForbiddenException(MESSENGER_CORE_CLIENT_ATTENTION_FORBIDDEN);
    }
    return assignConversationAttention(this.prisma, {
      ...input,
      conversationId,
      assignedById: actorId,
    });
  }

  private assertClientSurface(zone: string): void {
    if (zone === MESSENGER_CORE_CLIENT_ZONE) return;
    throw new NotFoundException(MESSENGER_CORE_CLIENT_INTERNAL_ZONE_FORBIDDEN);
  }

  private async requireView(employeeId: string) {
    const access = await loadMessengerLegacyAccess(this.prisma, employeeId);
    if (!access || access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    return access;
  }
}
