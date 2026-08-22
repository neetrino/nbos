import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';
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
 * Tasks-owned discussion. Authorship is ActorContext — External Agents are
 * recorded as themselves, never as a forged Employee.
 */
@Injectable()
export class TaskDiscussionService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /** `tx` lets the agent gateway commit the entry and its idempotency checkpoint together. */
  async addEntry(
    taskId: string,
    actor: ActorContext,
    rawBody: unknown,
    access?: TasksAccessContext,
    tx?: TasksDbClient,
  ): Promise<TaskDiscussionEntryView> {
    const db = tx ?? this.prisma;
    await this.assertTaskOpen(taskId, access, db);
    const body = requireDiscussionBody(rawBody);
    const actorFields = discussionActorFields(actor);
    const created = await db.taskDiscussionEntry.create({
      data: { taskId, body, visibility: 'STANDARD', ...actorFields },
    });
    return toDiscussionView(created);
  }

  async listEntries(
    taskId: string,
    query: { page?: number; pageSize?: number; latest?: boolean },
    access?: TasksAccessContext,
  ): Promise<TaskDiscussionListResult> {
    await this.assertTaskReadable(taskId, access);
    const pageSize = clampDiscussionPageSize(query.pageSize);
    const where = { taskId, visibility: 'STANDARD' as const };
    const total = await this.prisma.taskDiscussionEntry.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const page = resolveDiscussionPage(query, totalPages);
    const rows = await this.prisma.taskDiscussionEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: total === 0 ? 0 : (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map(toDiscussionView),
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

function toDiscussionView(row: {
  id: string;
  body: string;
  actorType: string;
  actorId: string;
  actorDisplayName: string;
  channelSource: string | null;
  createdAt: Date;
}): TaskDiscussionEntryView {
  return {
    id: row.id,
    body: row.body,
    authorActorType: row.actorType,
    authorActorId: row.actorId,
    authorDisplayName: row.actorDisplayName,
    channelSource: row.channelSource,
    createdAt: row.createdAt,
  };
}
