import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type MessengerCollectionVisibility,
  type MessengerConversationZone,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import {
  addCoreCollectionItem,
  addCoreCollectionMember,
  createCoreCollection,
  isCoreCollectionMember,
  type MessengerCoreCollectionDto,
} from './messenger-core-collection.ops';

@Injectable()
export class MessengerCoreCollectionService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async createCollection(
    employeeId: string,
    input: {
      name: string;
      visibility: MessengerCollectionVisibility;
      zone: MessengerConversationZone;
    },
  ): Promise<MessengerCoreCollectionDto> {
    await this.requireView(employeeId);
    return createCoreCollection(this.prisma, {
      ...input,
      ownerEmployeeId: employeeId,
    });
  }

  async addMember(
    collectionId: string,
    actorId: string,
    employeeId: string,
  ): Promise<{ id: string }> {
    await this.requireCollectionManage(collectionId, actorId);
    return addCoreCollectionMember(this.prisma, collectionId, employeeId);
  }

  async addItem(
    collectionId: string,
    actorId: string,
    conversationId: string,
  ): Promise<{ id: string }> {
    await this.requireCollectionManage(collectionId, actorId);
    await this.requireConversationRead(conversationId, actorId);
    return addCoreCollectionItem(this.prisma, collectionId, conversationId);
  }

  private async requireView(employeeId: string): Promise<MessengerLegacyAccessContext> {
    const access = await loadMessengerLegacyAccess(this.prisma, employeeId);
    if (!access || access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    return access;
  }

  private async requireCollectionManage(collectionId: string, employeeId: string): Promise<void> {
    await this.requireView(employeeId);
    const allowed = await isCoreCollectionMember(this.prisma, collectionId, employeeId);
    if (!allowed) throw new NotFoundException('Collection not found');
  }

  private async requireConversationRead(conversationId: string, employeeId: string): Promise<void> {
    const loaded = await loadMessengerCoreAccessFacts(this.prisma, employeeId, conversationId);
    if (!loaded.access || loaded.access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    if (!loaded.facts) throw new NotFoundException('Conversation not found');
    const decision = evaluateMessengerCoreAccess(loaded.facts);
    if (!decision.canRead) throw new NotFoundException('Conversation not found');
  }
}
