import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  PrismaClient,
  type MessengerParticipantRole,
  type PlatformAccessActionEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { type MessengerLegacyAccessContext } from '../access/messenger-legacy-channel-access.op';
import { MessengerGateway } from '../messenger.gateway';
import { MESSENGER_WS_READ_UPDATED_SCOPE } from '@nbos/shared';
import { evictIfCoreReadLost } from './messenger-core-access-revoke.ops';
import { resolveCoreConversationRead } from './messenger-core-read-authorize';
import {
  assertClientMayPersist,
  requireMessengerEditAccess,
  validateCorePersistAttachments,
} from './messenger-core-service-guards';
import type {
  MessengerCoreAccessDecision,
  MessengerCoreAccessFacts,
} from './messenger-core-access.types';
import {
  MESSENGER_CORE_AUDIT_OVERRIDE_GRANTED,
  MESSENGER_CORE_AUDIT_OVERRIDE_REVOKED,
  MESSENGER_CORE_AUDIT_PARTICIPANT_GRANTED,
  MESSENGER_CORE_AUDIT_PARTICIPANT_REVOKED,
} from './messenger-core-access.types';
import { createCoreConversation, getCoreConversation } from './messenger-core-conversation.ops';
import { addCoreConversationLink } from './messenger-core-link.ops';
import { persistCoreMessage } from './messenger-core-message.ops';
import {
  finalizeWhatsAppCoreOutbound,
  findClientWhatsAppMapping,
} from './messenger-wa-outbound.ops';
import { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import {
  grantMessengerConversationOverride,
  revokeMessengerConversationOverride,
} from './messenger-core-override.ops';
import {
  addCoreParticipant,
  leaveCoreParticipant,
  markCoreConversationRead,
} from './messenger-core-participant.ops';
import {
  MESSENGER_CORE_CLIENT_CREATE_FORBIDDEN,
  MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN,
  MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN,
} from './messenger-core.constants';
import { isInternalZone } from './messenger-core-zone';
import type {
  CreateMessengerCoreConversationInput,
  CreateMessengerCoreReferenceInput,
  MessengerCoreConversationDto,
  MessengerCoreLinkInput,
  MessengerCoreMessageDto,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';
import { createCoreMessageReference } from './messenger-core-reference.ops';
import { assertReferenceConversations } from './messenger-core-reference-access';

type ResolvedAccess = {
  access: MessengerLegacyAccessContext;
  facts: MessengerCoreAccessFacts;
  decision: MessengerCoreAccessDecision;
};

@Injectable()
export class MessengerCoreService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly messengerGateway: MessengerGateway,
    private readonly audit: AuditService,
    @Optional() private readonly whatsAppOutbound?: WhatsAppOutboundQueueService,
  ) {}

  async createConversation(
    input: CreateMessengerCoreConversationInput,
  ): Promise<MessengerCoreConversationDto> {
    const access = await requireMessengerEditAccess(this.prisma, input.createdById);
    if (input.zone === 'CLIENT' && access.clientReadScope === 'NONE') {
      throw new ForbiddenException(MESSENGER_CORE_CLIENT_CREATE_FORBIDDEN);
    }
    return createCoreConversation(this.prisma, input);
  }

  async getConversation(
    conversationId: string,
    employeeId: string,
  ): Promise<MessengerCoreConversationDto> {
    await this.requireRead(conversationId, employeeId);
    const conversation = await getCoreConversation(this.prisma, conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async persistAndBroadcast(
    input: PersistMessengerCoreMessageInput,
  ): Promise<MessengerCoreMessageDto> {
    const senderId = input.senderId;
    if (!senderId) {
      throw new ForbiddenException(MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN);
    }
    const resolved = await this.requireRead(input.conversationId, senderId);
    if (isInternalZone(resolved.facts.zone)) {
      if (!resolved.decision.canWrite) {
        throw new ForbiddenException(MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN);
      }
    } else {
      assertClientMayPersist(resolved.decision);
    }
    const fileAssetIds = await validateCorePersistAttachments(
      this.prisma,
      resolved.access,
      input.fileAssetIds,
    );
    const mapping = isInternalZone(resolved.facts.zone)
      ? null
      : await findClientWhatsAppMapping(this.prisma, input.conversationId);
    const message = await persistCoreMessage(
      this.prisma,
      { ...input, status: mapping ? 'QUEUED' : input.status },
      fileAssetIds,
      mapping ? { mapping, actorEmployeeId: senderId } : undefined,
    );
    const delivered = await finalizeWhatsAppCoreOutbound(
      this.prisma,
      this.whatsAppOutbound,
      message,
      senderId,
      mapping,
    );
    this.messengerGateway.publishPersistedCoreMessage(delivered, {
      zone: resolved.facts.zone,
      conversationType: resolved.facts.conversationType,
    });
    return delivered;
  }

  async addLink(
    conversationId: string,
    employeeId: string,
    link: MessengerCoreLinkInput,
  ): Promise<{ id: string }> {
    await this.requireWrite(conversationId, employeeId);
    return addCoreConversationLink(this.prisma, conversationId, link);
  }

  async addReference(employeeId: string, input: CreateMessengerCoreReferenceInput) {
    await requireMessengerEditAccess(this.prisma, employeeId);
    await assertReferenceConversations(
      this.prisma,
      input,
      (conversationId) => this.requireRead(conversationId, employeeId),
      (conversationId) => this.requireWrite(conversationId, employeeId),
    );
    return createCoreMessageReference(this.prisma, { ...input, createdById: employeeId });
  }

  async markRead(conversationId: string, employeeId: string): Promise<void> {
    const resolved = await this.requireRead(conversationId, employeeId);
    const lastReadAt = await markCoreConversationRead(
      this.prisma,
      conversationId,
      employeeId,
      new Date(),
    );
    this.messengerGateway.emitConversationReadUpdated(employeeId, {
      scope: MESSENGER_WS_READ_UPDATED_SCOPE.CONVERSATION,
      conversationId,
      unreadCount: 0,
      zone: resolved.facts.zone,
      lastReadAt: lastReadAt.toISOString(),
    });
  }

  async inviteParticipant(
    conversationId: string,
    actorId: string,
    employeeId: string,
    role: MessengerParticipantRole = 'READ_ONLY',
  ) {
    const resolved = await this.requireWrite(conversationId, actorId);
    const row = await addCoreParticipant(this.prisma, conversationId, employeeId, role);
    if (resolved.facts.zone === 'CLIENT') {
      await this.audit.log({
        entityType: 'messenger_conversation',
        entityId: conversationId,
        action: MESSENGER_CORE_AUDIT_PARTICIPANT_GRANTED,
        userId: actorId,
        changes: { employeeId, role },
      });
    }
    return row;
  }

  async revokeParticipant(conversationId: string, actorId: string, employeeId: string) {
    const resolved = await this.requireWrite(conversationId, actorId);
    const row = await leaveCoreParticipant(this.prisma, conversationId, employeeId);
    await evictIfCoreReadLost(
      this.prisma,
      conversationId,
      employeeId,
      resolved.facts.zone,
      this.messengerGateway.evictEmployeeFromConversation.bind(this.messengerGateway),
    );
    if (resolved.facts.zone === 'CLIENT') {
      await this.audit.log({
        entityType: 'messenger_conversation',
        entityId: conversationId,
        action: MESSENGER_CORE_AUDIT_PARTICIPANT_REVOKED,
        userId: actorId,
        changes: { employeeId },
      });
    }
    return row;
  }

  async grantAccessOverride(
    conversationId: string,
    actorId: string,
    employeeId: string,
    level: PlatformAccessActionEnum,
    reason?: string,
  ) {
    await this.requireWrite(conversationId, actorId);
    const row = await grantMessengerConversationOverride(this.prisma, {
      conversationId,
      employeeId,
      level,
      grantedById: actorId,
      reason,
    });
    await this.audit.log({
      entityType: 'messenger_conversation',
      entityId: conversationId,
      action: MESSENGER_CORE_AUDIT_OVERRIDE_GRANTED,
      userId: actorId,
      changes: { employeeId, level, reason: reason?.trim() || null },
    });
    return row;
  }

  async revokeAccessOverride(conversationId: string, actorId: string, employeeId: string) {
    const resolved = await this.requireWrite(conversationId, actorId);
    const row = await revokeMessengerConversationOverride(this.prisma, conversationId, employeeId);
    await evictIfCoreReadLost(
      this.prisma,
      conversationId,
      employeeId,
      resolved.facts.zone,
      this.messengerGateway.evictEmployeeFromConversation.bind(this.messengerGateway),
    );
    await this.audit.log({
      entityType: 'messenger_conversation',
      entityId: conversationId,
      action: MESSENGER_CORE_AUDIT_OVERRIDE_REVOKED,
      userId: actorId,
      changes: { employeeId },
    });
    return row;
  }

  async requireRead(conversationId: string, employeeId: string): Promise<ResolvedAccess> {
    const resolved = await resolveCoreConversationRead(this.prisma, employeeId, conversationId);
    if (resolved.status === 'NO_VIEW') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    if (resolved.status !== 'OK') {
      throw new NotFoundException('Conversation not found');
    }
    return { access: resolved.access, facts: resolved.facts, decision: resolved.decision };
  }

  async requireWrite(conversationId: string, employeeId: string): Promise<ResolvedAccess> {
    const resolved = await this.requireRead(conversationId, employeeId);
    if (!resolved.decision.canWrite) {
      const message = isInternalZone(resolved.facts.zone)
        ? MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN
        : MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN;
      throw new ForbiddenException(message);
    }
    return resolved;
  }

  async requireEditAccess(employeeId: string): Promise<MessengerLegacyAccessContext> {
    return requireMessengerEditAccess(this.prisma, employeeId);
  }
}
