import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';
import { isActorType } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { assertTaskAccessible } from './task-access.op';
import type { TasksDbClient } from './tasks-db-client';
import {
  clampDiscussionPageSize,
  discussionActorFields,
  requireDiscussionBody,
  resolveDiscussionPage,
} from './task-discussion.rules';
import type { TasksAccessContext } from './tasks-scoped-access';
import { assertEntityIsActive } from '../../common/lifecycle/entity-lifecycle-guards';
import { MessengerCoreService } from '../messenger/core/messenger-core.service';
import { persistCoreMessage } from '../messenger/core/messenger-core-message.ops';
import { ensureTaskConversation } from '../messenger/core/messenger-core-task-ensure.ops';
import { taskCanonicalKey } from '../messenger/core/messenger-core-canonical-key';
import {
  parseTaskDiscussionMeta,
  provenanceForActorType,
  senderIdForActor,
  TASK_DISCUSSION_VISIBILITY_HIDDEN,
  TASK_DISCUSSION_VISIBILITY_STANDARD,
  taskDiscussionMetadata,
} from '../messenger/core/messenger-task-discussion.metadata';
import { TASK_DISCUSSION_LEGACY_WRITES_DISABLED } from './task-discussion.constants';

export interface TaskDiscussionEntryView {
  id: string;
  body: string;
  authorActorType: string;
  authorActorId: string;
  authorDisplayName: string;
  channelSource: string | null;
  createdAt: Date;
}

export interface TaskDiscussionListResult {
  items: TaskDiscussionEntryView[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

/**
 * Human Task Discussion on Messaging Core (M-TASK-01). Activity stays Task-owned.
 * Legacy TaskDiscussionEntry writes are frozen (DELETE-LATER).
 */
@Injectable()
export class TaskDiscussionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly core: MessengerCoreService,
  ) {}

  /** `tx` lets the agent gateway commit the Core message and its checkpoint together. */
  async addEntry(
    taskId: string,
    actor: ActorContext,
    rawBody: unknown,
    access?: TasksAccessContext,
    tx?: TasksDbClient,
  ): Promise<TaskDiscussionEntryView> {
    void TASK_DISCUSSION_LEGACY_WRITES_DISABLED;
    const db = tx ?? this.prisma;
    await this.assertTaskOpen(taskId, access, db);
    const body = requireDiscussionBody(rawBody);
    const actorFields = discussionActorFields(actor);
    const opener = actor.actor.type === 'USER' ? actor.actor.id : undefined;
    const conversation = await ensureTaskConversation(db as never, taskId, access, opener);
    return this.persistCoreNote(db, conversation.id, actor, actorFields, body, Boolean(tx));
  }

  async listEntries(
    taskId: string,
    query: { page?: number; pageSize?: number; latest?: boolean },
    access?: TasksAccessContext,
  ): Promise<TaskDiscussionListResult> {
    await this.assertTaskReadable(taskId, access);
    const pageSize = clampDiscussionPageSize(query.pageSize);
    const conversation = await this.prisma.messengerConversation.findUnique({
      where: { canonicalKey: taskCanonicalKey(taskId) },
      select: { id: true },
    });
    if (!conversation) {
      return emptyDiscussionList(pageSize);
    }
    return this.listCoreNotes(conversation.id, query, pageSize);
  }

  private async persistCoreNote(
    db: TasksDbClient,
    conversationId: string,
    actor: ActorContext,
    actorFields: ReturnType<typeof discussionActorFields>,
    body: string,
    inTransaction: boolean,
  ): Promise<TaskDiscussionEntryView> {
    const actorType = isActorType(actor.actor.type) ? actor.actor.type : 'SYSTEM';
    const input = {
      conversationId,
      senderId: senderIdForActor(actorFields.actorType, actorFields.actorId),
      senderNameSnapshot: actorFields.actorDisplayName,
      content: body,
      provenance: provenanceForActorType(actorType),
      idempotencyKey: actorFields.correlationId ?? undefined,
      metadata: taskDiscussionMetadata({
        actorType: actorFields.actorType,
        actorId: actorFields.actorId,
        channelSource: actorFields.channelSource,
        correlationId: actorFields.correlationId,
        visibility: TASK_DISCUSSION_VISIBILITY_STANDARD,
      }),
    };
    if (actor.actor.type === 'USER' && !inTransaction && input.senderId) {
      const message = await this.core.persistAndBroadcast(input);
      return toDiscussionViewFromCore(message, actorFields);
    }
    const message = await persistCoreMessage(db as never, input, []);
    return toDiscussionViewFromCore(message, actorFields);
  }

  private async listCoreNotes(
    conversationId: string,
    query: { page?: number; pageSize?: number; latest?: boolean },
    pageSize: number,
  ): Promise<TaskDiscussionListResult> {
    const where = {
      conversationId,
      deletedAt: null,
      NOT: {
        metadata: {
          path: ['taskDiscussion', 'visibility'] as string[],
          equals: TASK_DISCUSSION_VISIBILITY_HIDDEN,
        },
      },
    };
    const total = await this.prisma.messengerMessage.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const page = resolveDiscussionPage(query, totalPages);
    const rows = await this.prisma.messengerMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: total === 0 ? 0 : (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((row) => toDiscussionViewFromRow(row)),
      meta: { total, page, pageSize, totalPages },
    };
  }

  private async assertTaskReadable(
    taskId: string,
    access?: TasksAccessContext,
    db: TasksDbClient = this.prisma,
  ): Promise<void> {
    await assertTaskAccessible(db, taskId, access);
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { id: true, trashedAt: true },
    });
    if (!task || task.trashedAt) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
  }

  private async assertTaskOpen(
    taskId: string,
    access?: TasksAccessContext,
    db: TasksDbClient = this.prisma,
  ): Promise<void> {
    await this.assertTaskReadable(taskId, access, db);
    const task = await db.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { trashedAt: true },
    });
    assertEntityIsActive(task, 'trashedAt', 'Task');
  }
}

function emptyDiscussionList(pageSize: number): TaskDiscussionListResult {
  return { items: [], meta: { total: 0, page: 1, pageSize, totalPages: 0 } };
}

function toDiscussionViewFromCore(
  row: { id: string; content: string; senderName: string; createdAt: Date },
  actor: ReturnType<typeof discussionActorFields>,
): TaskDiscussionEntryView {
  return {
    id: row.id,
    body: row.content,
    authorActorType: actor.actorType,
    authorActorId: actor.actorId,
    authorDisplayName: actor.actorDisplayName,
    channelSource: actor.channelSource,
    createdAt: row.createdAt,
  };
}

function toDiscussionViewFromRow(row: {
  id: string;
  content: string;
  senderId: string | null;
  senderNameSnapshot: string;
  metadata: unknown;
  createdAt: Date;
}): TaskDiscussionEntryView {
  const meta = parseTaskDiscussionMeta(row.metadata);
  return {
    id: row.id,
    body: row.content,
    authorActorType: meta?.actorType ?? (row.senderId ? 'USER' : 'EXTERNAL_AGENT'),
    authorActorId: meta?.actorId ?? row.senderId ?? '',
    authorDisplayName: row.senderNameSnapshot,
    channelSource: meta?.channelSource ?? null,
    createdAt: row.createdAt,
  };
}
