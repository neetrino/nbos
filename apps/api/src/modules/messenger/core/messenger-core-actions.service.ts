import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';
import { MessengerGateway } from '../messenger.gateway';
import { persistForwardHolderAndReferences } from './messenger-core-forward.ops';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { assertForwardTargetZone } from './messenger-core-reference-access';
import { deleteCoreMessageReference } from './messenger-core-reference.ops';
import { loadCoreSourceMessage } from './messenger-core-source-message.ops';
import { requireTaskEntityAccess } from './messenger-core-task-access.ops';
import { attachTaskSourceReferences } from './messenger-core-task-source.ops';
import { requireTicketEntityAccess } from './messenger-core-ticket-access.ops';
import { listTicketSourceReferences } from './messenger-core-ticket-source-list.ops';
import { attachTicketSourceReferences } from './messenger-core-ticket-source.ops';
import { MessengerCoreService } from './messenger-core.service';

const PURPOSE_TASK_SOURCE = 'TASK_SOURCE';
const PURPOSE_TICKET_SOURCE = 'TICKET_SOURCE';

type ReferenceMutationRow = {
  purpose: string;
  entityType: string | null;
  entityId: string | null;
  targetConversationId: string | null;
};

@Injectable()
export class MessengerCoreActionsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly core: MessengerCoreService,
    private readonly messengerGateway: MessengerGateway,
  ) {}

  async getSourceMessage(employeeId: string, messageId: string) {
    const message = await loadCoreSourceMessage(this.prisma, messageId);
    await this.core.requireRead(message.conversationId, employeeId);
    return message;
  }

  async deleteReference(employeeId: string, referenceId: string, tasksAccess: TasksAccessContext) {
    const existing = await this.prisma.messengerMessageReference.findUnique({
      where: { id: referenceId },
      select: {
        sourceMessageId: true,
        targetConversationId: true,
        purpose: true,
        entityType: true,
        entityId: true,
      },
    });
    if (!existing) throw new NotFoundException('Message reference not found');
    await this.core.requireEditAccess(employeeId);
    await this.assertReferenceMutationAccess(existing, employeeId, tasksAccess);
    return deleteCoreMessageReference(this.prisma, referenceId);
  }

  async attachTaskSources(
    employeeId: string,
    sourceMessageIds: string[],
    taskId: string,
    tasksAccess: TasksAccessContext,
  ) {
    await this.core.requireEditAccess(employeeId);
    await requireTaskEntityAccess(this.prisma, taskId, tasksAccess);
    const sources = await loadOrderedSourceMessages(this.prisma, sourceMessageIds);
    await this.requireSourceReads(employeeId, sources);
    return attachTaskSourceReferences(this.prisma, {
      sourceMessageIds: sources.map((row) => row.id),
      taskId,
      createdById: employeeId,
    });
  }

  async attachTicketSources(employeeId: string, sourceMessageIds: string[], ticketId: string) {
    await requireTicketEntityAccess(this.prisma, ticketId);
    const sources = await loadOrderedSourceMessages(this.prisma, sourceMessageIds);
    await this.requireSourceReads(employeeId, sources);
    return attachTicketSourceReferences(this.prisma, {
      sourceMessageIds: sources.map((row) => row.id),
      ticketId,
      createdById: employeeId,
    });
  }

  async listTicketSources(employeeId: string, ticketId: string) {
    await requireTicketEntityAccess(this.prisma, ticketId);
    return listTicketSourceReferences(this.prisma, ticketId, async (conversationId) => {
      try {
        await this.core.requireRead(conversationId, employeeId);
        return true;
      } catch {
        return false;
      }
    });
  }

  async forwardMessages(
    employeeId: string,
    targetConversationId: string,
    sourceMessageIds: string[],
  ) {
    const target = await this.core.requireWrite(targetConversationId, employeeId);
    assertForwardTargetZone(target.facts.zone);
    const sources = await loadOrderedSourceMessages(this.prisma, sourceMessageIds);
    await this.requireSourceReads(employeeId, sources);
    const result = await persistForwardHolderAndReferences(this.prisma, {
      targetConversationId,
      senderId: employeeId,
      sourceMessageIds: sources.map((row) => row.id),
    });
    this.messengerGateway.publishPersistedCoreMessage(result.holder);
    return result;
  }

  private async assertReferenceMutationAccess(
    existing: ReferenceMutationRow,
    employeeId: string,
    tasksAccess: TasksAccessContext,
  ): Promise<void> {
    if (existing.purpose === PURPOSE_TASK_SOURCE && existing.entityId) {
      await requireTaskEntityAccess(this.prisma, existing.entityId, tasksAccess);
      return;
    }
    if (existing.purpose === PURPOSE_TICKET_SOURCE && existing.entityId) {
      await requireTicketEntityAccess(this.prisma, existing.entityId);
      return;
    }
    if (existing.targetConversationId) {
      await this.core.requireWrite(existing.targetConversationId, employeeId);
    }
  }

  private async requireSourceReads(
    employeeId: string,
    sources: Array<{ conversationId: string }>,
  ): Promise<void> {
    const conversationIds = [...new Set(sources.map((row) => row.conversationId))];
    for (const conversationId of conversationIds) {
      await this.core.requireRead(conversationId, employeeId);
    }
  }
}
