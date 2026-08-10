import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { MessengerGateway } from './messenger.gateway';
import type { EnsureConversationInput } from './unified/messenger-conversation-ensure.ops';
import { mapUnifiedMessageToLegacyDto } from './unified/messenger-conversation-message.mapper';
import {
  unifiedEnsureConversation,
  unifiedGetConversation,
  unifiedGetMessages,
  unifiedListL1Entities,
  unifiedListL2Conversations,
  unifiedMarkRead,
  unifiedSearch,
  unifiedSendMessage,
} from './unified/messenger-unified.ops';
import type { MessengerInternalTab } from './unified/messenger-unified.types';
import type { MessengerHistoryListParams } from './messenger.types';

@Injectable()
export class MessengerUnifiedService {
  private readonly logger = new Logger(MessengerUnifiedService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly messengerGateway: MessengerGateway,
  ) {}

  listL1Entities(employeeId: string, tab: MessengerInternalTab, search?: string) {
    return unifiedListL1Entities(this.prisma, employeeId, tab, search);
  }

  listL2Conversations(
    employeeId: string,
    opts: {
      entityType?: 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'DIRECT_BUCKET';
      entityId?: string;
      projectTree?: boolean;
      includeInternalGroups?: boolean;
    },
  ) {
    return unifiedListL2Conversations(this.prisma, employeeId, opts);
  }

  ensureConversation(employeeId: string, input: EnsureConversationInput) {
    return unifiedEnsureConversation(this.prisma, employeeId, input);
  }

  getConversation(employeeId: string, conversationId: string) {
    return unifiedGetConversation(this.prisma, employeeId, conversationId);
  }

  getMessages(
    employeeId: string,
    conversationId: string,
    params: MessengerHistoryListParams = {},
  ) {
    return unifiedGetMessages(this.prisma, employeeId, conversationId, params);
  }

  async sendMessage(
    employeeId: string,
    conversationId: string,
    content: string,
    fileAssetIds?: string[],
  ) {
    const dto = await unifiedSendMessage(
      this.prisma,
      this.auditService,
      employeeId,
      conversationId,
      content,
      fileAssetIds,
    );
    this.messengerGateway.emitConversationMessage(conversationId, dto);
    // Dual-emit legacy channel event when conversation id matches a legacy channel room.
    this.messengerGateway.emitChannelMessage(
      conversationId,
      mapUnifiedMessageToLegacyDto(dto),
    );
    this.logger.debug(`Unified message sent in ${conversationId}`);
    return dto;
  }

  async markRead(employeeId: string, conversationId: string): Promise<void> {
    const result = await unifiedMarkRead(this.prisma, employeeId, conversationId);
    this.messengerGateway.emitReadListsUpdated(employeeId);
    this.messengerGateway.emitConversationPeerRead(conversationId, {
      conversationId,
      readerId: employeeId,
      lastReadAt: result.lastReadAt.toISOString(),
    });
    if (result.type === 'DIRECT' && result.peerEmployeeId) {
      this.messengerGateway.emitDmPeerRead(result.peerEmployeeId, {
        counterpartId: employeeId,
        threadId: conversationId,
        lastReadAt: result.lastReadAt.toISOString(),
      });
    } else {
      this.messengerGateway.emitChannelPeerRead(conversationId, {
        channelId: conversationId,
        readerId: employeeId,
        lastReadAt: result.lastReadAt.toISOString(),
      });
    }
  }

  search(employeeId: string, query: string) {
    return unifiedSearch(this.prisma, employeeId, query);
  }
}
