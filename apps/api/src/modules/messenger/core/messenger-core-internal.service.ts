import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { loadMessengerLegacyAccess } from '../access/messenger-legacy-channel-access.op';
import {
  MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN,
  MESSENGER_CORE_INTERNAL_CREATE_TYPE_FORBIDDEN,
  MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN,
  MESSENGER_CORE_INTERNAL_ZONE,
} from './messenger-core.constants';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';
import { listCoreConversationMessages } from './messenger-core-internal-messages.ops';
import type {
  MessengerInternalConversationDetail,
  MessengerInternalListQuery,
  MessengerInternalListResult,
  MessengerInternalMessagePage,
} from './messenger-core-internal.types';
import { mapAllLegacyInternalToCore } from './messenger-legacy-mapper.ops';
import { mapAllTaskDiscussionsToCore } from './messenger-task-discussion-mapper.ops';
import { MessengerCoreService } from './messenger-core.service';
import { isInternalZone } from './messenger-core-zone';
import { toggleInternalFavorite } from './messenger-core-favorites.ops';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import {
  ensureDealConversation,
  ensureProductWorkConversation,
  ensureProjectGeneralConversation,
  ensureWorkSpaceConversation,
} from './messenger-core-entity-ensure.ops';
import type {
  MessengerCoreConversationDto,
  MessengerCoreMessageDto,
  MessengerEntityEnsureResult,
  PersistMessengerCoreMessageInput,
} from './messenger-core.types';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

@Injectable()
export class MessengerCoreInternalService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly core: MessengerCoreService,
  ) {}

  async mapLegacyInternal(): Promise<{ channels: number; threads: number }> {
    return mapAllLegacyInternalToCore(this.prisma);
  }

  async mapTaskDiscussion(): Promise<ReturnType<typeof mapAllTaskDiscussionsToCore>> {
    return mapAllTaskDiscussionsToCore(this.prisma);
  }

  async listConversations(
    employeeId: string,
    query: MessengerInternalListQuery,
    tasksAccess?: TasksAccessContext,
  ): Promise<MessengerInternalListResult> {
    const access = await this.requireView(employeeId);
    return listAccessibleInternalConversations(
      this.prisma,
      employeeId,
      access.viewScope,
      query,
      access.editScope,
      tasksAccess,
    );
  }

  async getConversation(
    conversationId: string,
    employeeId: string,
  ): Promise<MessengerInternalConversationDetail> {
    const conversation = await this.core.getConversation(conversationId, employeeId);
    this.assertInternalSurface(conversation.zone);
    const loaded = await loadMessengerCoreAccessFacts(this.prisma, employeeId, conversationId);
    const canWrite = loaded.facts ? evaluateMessengerCoreAccess(loaded.facts).canWrite : false;
    return { ...conversation, canWrite };
  }

  async listMessages(
    conversationId: string,
    employeeId: string,
    query: { before?: string; pageSize?: number },
  ): Promise<MessengerInternalMessagePage> {
    const conversation = await this.getConversation(conversationId, employeeId);
    return listCoreConversationMessages(this.prisma, conversationId, query, {
      excludeHiddenTaskNotes: conversation.type === 'TASK',
    });
  }

  async persistMessage(input: PersistMessengerCoreMessageInput): Promise<MessengerCoreMessageDto> {
    const senderId = input.senderId;
    if (!senderId) {
      throw new ForbiddenException(MESSENGER_CORE_INTERNAL_WRITE_FORBIDDEN);
    }
    await this.getConversation(input.conversationId, senderId);
    return this.core.persistAndBroadcast(input);
  }

  async toggleFavorite(
    conversationId: string,
    employeeId: string,
  ): Promise<{ favorite: boolean; collectionId: string }> {
    await this.getConversation(conversationId, employeeId);
    return toggleInternalFavorite(this.prisma, employeeId, conversationId);
  }

  async markRead(conversationId: string, employeeId: string): Promise<void> {
    await this.getConversation(conversationId, employeeId);
    return this.core.markRead(conversationId, employeeId);
  }

  async createConversation(
    employeeId: string,
    input: {
      type: 'INTERNAL_GROUP' | 'DIRECT';
      title?: string;
      peerEmployeeId?: string;
      participantIds?: string[];
    },
  ): Promise<MessengerCoreConversationDto> {
    if (input.type !== 'INTERNAL_GROUP' && input.type !== 'DIRECT') {
      throw new BadRequestException(MESSENGER_CORE_INTERNAL_CREATE_TYPE_FORBIDDEN);
    }
    return this.core.createConversation({
      zone: MESSENGER_CORE_INTERNAL_ZONE,
      type: input.type,
      title: input.title,
      createdById: employeeId,
      peerEmployeeId: input.peerEmployeeId,
      participantIds: input.participantIds,
    });
  }

  async ensureProduct(
    productId: string,
    employeeId: string,
  ): Promise<MessengerInternalConversationDetail & Pick<MessengerEntityEnsureResult, 'created'>> {
    return this.finishEnsure(employeeId, () =>
      ensureProductWorkConversation(this.prisma, productId, employeeId),
    );
  }

  async ensureWorkSpace(
    workspaceId: string,
    employeeId: string,
    tasksViewScope?: string,
  ): Promise<MessengerInternalConversationDetail & Pick<MessengerEntityEnsureResult, 'created'>> {
    return this.finishEnsure(employeeId, () =>
      ensureWorkSpaceConversation(this.prisma, workspaceId, employeeId, tasksViewScope),
    );
  }

  async ensureDeal(
    dealId: string,
    employeeId: string,
  ): Promise<MessengerInternalConversationDetail & Pick<MessengerEntityEnsureResult, 'created'>> {
    return this.finishEnsure(employeeId, () =>
      ensureDealConversation(this.prisma, dealId, employeeId),
    );
  }

  async ensureProjectGeneral(
    projectId: string,
    employeeId: string,
  ): Promise<MessengerInternalConversationDetail & Pick<MessengerEntityEnsureResult, 'created'>> {
    return this.finishEnsure(employeeId, () =>
      ensureProjectGeneralConversation(this.prisma, projectId, employeeId),
    );
  }

  private async finishEnsure(
    employeeId: string,
    ensure: () => Promise<MessengerEntityEnsureResult>,
  ): Promise<MessengerInternalConversationDetail & Pick<MessengerEntityEnsureResult, 'created'>> {
    await this.requireView(employeeId);
    const ensured = await ensure();
    const detail = await this.getConversation(ensured.id, employeeId);
    return { ...detail, created: ensured.created };
  }

  private assertInternalSurface(zone: string): void {
    if (isInternalZone(zone as 'INTERNAL' | 'CLIENT')) return;
    throw new NotFoundException(MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN);
  }

  private async requireView(employeeId: string) {
    const access = await loadMessengerLegacyAccess(this.prisma, employeeId);
    if (!access || access.viewScope === 'NONE') {
      throw new ForbiddenException('No permission: MESSENGER.VIEW');
    }
    return access;
  }
}
