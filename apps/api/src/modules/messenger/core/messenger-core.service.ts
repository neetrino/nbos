import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import { assertMessengerFileAssetsAttachable } from '../messenger-attachment-access.op';
import { MessengerGateway } from '../messenger.gateway';
import { assertCoreFileAssetsExist } from './messenger-core-attachment.ops';
import { createCoreConversation, getCoreConversation } from './messenger-core-conversation.ops';
import { addCoreConversationLink } from './messenger-core-link.ops';
import { persistCoreMessage } from './messenger-core-message.ops';
import { markCoreConversationRead } from './messenger-core-participant.ops';
import { createCoreMessageReference } from './messenger-core-reference.ops';
import { MESSENGER_CORE_CLIENT_SEND_DISABLED } from './messenger-core.constants';
import { isInternalZone } from './messenger-core-zone';
import type {
  CreateMessengerCoreConversationInput,
  CreateMessengerCoreReferenceInput,
  MessengerCoreConversationDto,
  MessengerCoreLinkInput,
  MessengerCoreMessageDto,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';

@Injectable()
export class MessengerCoreService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly messengerGateway: MessengerGateway,
  ) {}

  async createConversation(
    input: CreateMessengerCoreConversationInput,
  ): Promise<MessengerCoreConversationDto> {
    await this.requireEditAccess(input.createdById);
    return createCoreConversation(this.prisma, input);
  }

  async getConversation(
    conversationId: string,
    employeeId: string,
  ): Promise<MessengerCoreConversationDto> {
    await this.requireViewAccess(employeeId);
    const conversation = await getCoreConversation(this.prisma, conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async persistAndBroadcast(
    input: PersistMessengerCoreMessageInput,
  ): Promise<MessengerCoreMessageDto> {
    const access = await this.requireEditAccess(input.senderId);
    const conversation = await getCoreConversation(this.prisma, input.conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (!isInternalZone(conversation.zone)) {
      throw new ForbiddenException(MESSENGER_CORE_CLIENT_SEND_DISABLED);
    }
    const fileAssetIds = await this.validateAttachments(access, input.fileAssetIds);
    const message = await persistCoreMessage(this.prisma, input, fileAssetIds);
    this.messengerGateway.emitCoreConversationMessage(conversation.id, message);
    return message;
  }

  async addLink(
    conversationId: string,
    employeeId: string,
    link: MessengerCoreLinkInput,
  ): Promise<{ id: string }> {
    await this.requireEditAccess(employeeId);
    await this.getConversation(conversationId, employeeId);
    return addCoreConversationLink(this.prisma, conversationId, link);
  }

  async addReference(employeeId: string, input: CreateMessengerCoreReferenceInput) {
    await this.requireEditAccess(employeeId);
    return createCoreMessageReference(this.prisma, input);
  }

  async markRead(conversationId: string, employeeId: string): Promise<void> {
    await this.requireViewAccess(employeeId);
    await this.getConversation(conversationId, employeeId);
    await markCoreConversationRead(this.prisma, conversationId, employeeId, new Date());
    this.messengerGateway.emitReadListsUpdated(employeeId);
  }

  private async validateAttachments(
    access: MessengerLegacyAccessContext,
    fileAssetIds: string[] | undefined,
  ): Promise<string[]> {
    const existing = await assertCoreFileAssetsExist(this.prisma, fileAssetIds ?? []);
    return assertMessengerFileAssetsAttachable(this.prisma, access, existing);
  }

  private async requireViewAccess(employeeId: string): Promise<MessengerLegacyAccessContext> {
    const access = await loadMessengerLegacyAccess(this.prisma, employeeId);
    if (!access || access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    return access;
  }

  private async requireEditAccess(employeeId: string): Promise<MessengerLegacyAccessContext> {
    const access = await this.requireViewAccess(employeeId);
    if (access.editScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.EDIT');
    }
    return access;
  }
}
