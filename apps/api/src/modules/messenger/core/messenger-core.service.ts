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
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import { assertMessengerFileAssetsAttachable } from '../messenger-attachment-access.op';
import { MessengerGateway } from '../messenger.gateway';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import { requireTaskConversationAccess } from './messenger-core-task-access.ops';
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
import { assertCoreFileAssetsExist } from './messenger-core-attachment.ops';
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
  MESSENGER_CORE_CLIENT_READ_ONLY,
  MESSENGER_CORE_CLIENT_SEND_FORBIDDEN,
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
    const access = await this.requireEditAccess(input.createdById);
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
      this.assertClientMayPersist(resolved.decision);
    }
    const fileAssetIds = await this.validateAttachments(resolved.access, input.fileAssetIds);
    const mapping = isInternalZone(resolved.facts.zone)
      ? null
      : await findClientWhatsAppMapping(this.prisma, input.conversationId);
    const message = await persistCoreMessage(
      this.prisma,
      { ...input, status: mapping ? 'QUEUED' : input.status },
      fileAssetIds,
    );
    const delivered = await finalizeWhatsAppCoreOutbound(
      this.prisma,
      this.whatsAppOutbound,
      message,
      senderId,
      mapping,
    );
    this.messengerGateway.emitCoreConversationMessage(resolved.facts.conversationId, delivered);
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
    await this.requireEditAccess(employeeId);
    await assertReferenceConversations(
      this.prisma,
      input,
      (conversationId) => this.requireRead(conversationId, employeeId),
      (conversationId) => this.requireWrite(conversationId, employeeId),
    );
    return createCoreMessageReference(this.prisma, { ...input, createdById: employeeId });
  }

  async markRead(conversationId: string, employeeId: string): Promise<void> {
    await this.requireRead(conversationId, employeeId);
    await markCoreConversationRead(this.prisma, conversationId, employeeId, new Date());
    this.messengerGateway.emitReadListsUpdated(employeeId);
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
    await this.requireWrite(conversationId, actorId);
    const row = await revokeMessengerConversationOverride(this.prisma, conversationId, employeeId);
    await this.audit.log({
      entityType: 'messenger_conversation',
      entityId: conversationId,
      action: MESSENGER_CORE_AUDIT_OVERRIDE_REVOKED,
      userId: actorId,
      changes: { employeeId },
    });
    return row;
  }

  private assertClientMayPersist(decision: MessengerCoreAccessDecision): void {
    if (decision.canSend) return;
    if (decision.sendDeniedBecause === 'READ_ONLY') {
      throw new ForbiddenException(MESSENGER_CORE_CLIENT_READ_ONLY);
    }
    throw new ForbiddenException(MESSENGER_CORE_CLIENT_SEND_FORBIDDEN);
  }

  async requireRead(conversationId: string, employeeId: string): Promise<ResolvedAccess> {
    const loaded = await loadMessengerCoreAccessFacts(this.prisma, employeeId, conversationId);
    if (!loaded.access || loaded.access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    if (!loaded.facts) throw new NotFoundException('Conversation not found');
    const decision = evaluateMessengerCoreAccess(loaded.facts);
    if (!decision.canRead) throw new NotFoundException('Conversation not found');
    if (loaded.facts.conversationType === 'TASK') {
      await requireTaskConversationAccess(this.prisma, conversationId, {
        employeeId,
        departmentIds: loaded.access.departmentIds,
        viewScope: loaded.access.tasksViewScope,
      });
    }
    return { access: loaded.access, facts: loaded.facts, decision };
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

  private async validateAttachments(
    access: MessengerLegacyAccessContext,
    fileAssetIds: string[] | undefined,
  ): Promise<string[]> {
    const existing = await assertCoreFileAssetsExist(this.prisma, fileAssetIds ?? []);
    return assertMessengerFileAssetsAttachable(this.prisma, access, existing);
  }

  async requireEditAccess(employeeId: string): Promise<MessengerLegacyAccessContext> {
    const access = await loadMessengerLegacyAccess(this.prisma, employeeId);
    if (!access || access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    if (access.editScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.EDIT');
    }
    return access;
  }
}
