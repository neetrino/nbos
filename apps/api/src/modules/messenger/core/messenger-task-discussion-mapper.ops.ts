import { PrismaClient } from '@nbos/database';
import { isActorType } from '@nbos/shared';
import { ensureTaskConversation } from './messenger-core-task-ensure.ops';
import {
  provenanceForActorType,
  senderIdForActor,
  TASK_DISCUSSION_VISIBILITY_HIDDEN,
  TASK_DISCUSSION_VISIBILITY_STANDARD,
  taskDiscussionEntryIdempotencyKey,
  taskDiscussionMetadata,
  type TaskDiscussionMessageMeta,
} from './messenger-task-discussion.metadata';
import { persistCoreMessage } from './messenger-core-message.ops';
import { taskDiscussionEntryLegacyIdentity } from './messenger-legacy-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type TaskDiscussionMapReport = {
  tasksWithDiscussion: number;
  tasksMapped: number;
  entriesSeen: number;
  entriesMapped: number;
  entriesSkippedExisting: number;
  hiddenPreserved: number;
  standardVisible: number;
  agentActors: number;
  employeeActors: number;
  correlationIdPresent: number;
  chatIdNonNullIgnored: number;
  attachmentsSkipped: 0;
  tasks: Array<{
    taskId: string;
    conversationId: string;
    entryCount: number;
    mappedCount: number;
    hiddenCount: number;
  }>;
};

type LegacyEntry = {
  id: string;
  taskId: string;
  body: string;
  actorType: string;
  actorId: string;
  actorDisplayName: string;
  channelSource: string | null;
  correlationId: string | null;
  visibility: string;
  createdAt: Date;
};

/** Backfill only Tasks that have at least one human discussion row. Empty Tasks stay lazy. */
export async function mapAllTaskDiscussionsToCore(
  prisma: PrismaLike,
): Promise<TaskDiscussionMapReport> {
  const [grouped, chatIdNonNullIgnored] = await Promise.all([
    prisma.taskDiscussionEntry.groupBy({
      by: ['taskId'],
      _count: { _all: true },
    }),
    prisma.task.count({ where: { chatId: { not: null } } }),
  ]);
  const report = emptyReport(chatIdNonNullIgnored);
  report.tasksWithDiscussion = grouped.length;
  for (const row of grouped) {
    mergeTaskReport(report, await mapTaskDiscussionToCore(prisma, row.taskId));
  }
  return report;
}

export async function mapTaskDiscussionToCore(
  prisma: PrismaLike,
  taskId: string,
): Promise<TaskDiscussionMapReport> {
  const entries = await prisma.taskDiscussionEntry.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
  });
  const chatIdNonNullIgnored = await prisma.task.count({
    where: { id: taskId, chatId: { not: null } },
  });
  const report = emptyReport(chatIdNonNullIgnored);
  if (entries.length === 0) return report;
  const ensured = await ensureTaskConversation(prisma, taskId, undefined);
  const mapped = await persistLegacyEntries(prisma, ensured.id, entries);
  report.tasksWithDiscussion = 1;
  report.tasksMapped = 1;
  report.entriesSeen = entries.length;
  report.entriesMapped = mapped.created;
  report.entriesSkippedExisting = mapped.skipped;
  report.hiddenPreserved = mapped.hidden;
  report.standardVisible = mapped.standard;
  report.agentActors = mapped.agentActors;
  report.employeeActors = mapped.employeeActors;
  report.correlationIdPresent = mapped.correlationIdPresent;
  report.tasks.push({
    taskId,
    conversationId: ensured.id,
    entryCount: entries.length,
    mappedCount: mapped.created,
    hiddenCount: mapped.hidden,
  });
  return report;
}

type PersistCounts = {
  created: number;
  skipped: number;
  hidden: number;
  standard: number;
  agentActors: number;
  employeeActors: number;
  correlationIdPresent: number;
};

async function persistLegacyEntries(
  prisma: PrismaLike,
  conversationId: string,
  entries: LegacyEntry[],
): Promise<PersistCounts> {
  const counts = zeroCounts();
  for (const entry of entries) {
    tallySource(counts, entry);
    const created = await persistOneLegacyEntry(prisma, conversationId, entry);
    if (created) counts.created += 1;
    else counts.skipped += 1;
  }
  return counts;
}

async function persistOneLegacyEntry(
  prisma: PrismaLike,
  conversationId: string,
  entry: LegacyEntry,
): Promise<boolean> {
  return prisma.$transaction((tx) => persistOneLegacyEntryTx(tx as never, conversationId, entry));
}

async function persistOneLegacyEntryTx(
  prisma: PrismaLike,
  conversationId: string,
  entry: LegacyEntry,
): Promise<boolean> {
  const identity = taskDiscussionEntryLegacyIdentity(entry.id);
  const already = await prisma.messengerLegacyIdentity.findUnique({
    where: { sourceKind_sourceId: identity },
  });
  if (already?.messageId) return false;
  const actorType = isActorType(entry.actorType) ? entry.actorType : 'SYSTEM';
  const message = await persistCoreMessage(
    prisma,
    {
      conversationId,
      senderId: senderIdForActor(entry.actorType, entry.actorId),
      senderNameSnapshot: entry.actorDisplayName,
      content: entry.body,
      provenance: provenanceForActorType(actorType),
      createdAt: entry.createdAt,
      idempotencyKey: taskDiscussionEntryIdempotencyKey(entry.id),
      metadata: taskDiscussionMetadata(metaFromEntry(entry)),
    },
    [],
  );
  await prisma.messengerLegacyIdentity.upsert({
    where: { sourceKind_sourceId: identity },
    create: { ...identity, conversationId, messageId: message.id },
    update: { conversationId, messageId: message.id },
  });
  return true;
}

function metaFromEntry(entry: LegacyEntry): TaskDiscussionMessageMeta {
  return {
    actorType: entry.actorType,
    actorId: entry.actorId,
    channelSource: entry.channelSource,
    correlationId: entry.correlationId,
    visibility:
      entry.visibility === TASK_DISCUSSION_VISIBILITY_HIDDEN
        ? TASK_DISCUSSION_VISIBILITY_HIDDEN
        : TASK_DISCUSSION_VISIBILITY_STANDARD,
  };
}

function tallySource(counts: PersistCounts, entry: LegacyEntry): void {
  if (entry.visibility === TASK_DISCUSSION_VISIBILITY_HIDDEN) counts.hidden += 1;
  else counts.standard += 1;
  if (entry.actorType === 'USER') counts.employeeActors += 1;
  else counts.agentActors += 1;
  if (entry.correlationId) counts.correlationIdPresent += 1;
}

function zeroCounts(): PersistCounts {
  return {
    created: 0,
    skipped: 0,
    hidden: 0,
    standard: 0,
    agentActors: 0,
    employeeActors: 0,
    correlationIdPresent: 0,
  };
}

function emptyReport(chatIdNonNullIgnored: number): TaskDiscussionMapReport {
  return {
    tasksWithDiscussion: 0,
    tasksMapped: 0,
    entriesSeen: 0,
    entriesMapped: 0,
    entriesSkippedExisting: 0,
    hiddenPreserved: 0,
    standardVisible: 0,
    agentActors: 0,
    employeeActors: 0,
    correlationIdPresent: 0,
    chatIdNonNullIgnored,
    attachmentsSkipped: 0,
    tasks: [],
  };
}

function mergeTaskReport(target: TaskDiscussionMapReport, next: TaskDiscussionMapReport): void {
  target.tasksMapped += next.tasksMapped;
  target.entriesSeen += next.entriesSeen;
  target.entriesMapped += next.entriesMapped;
  target.entriesSkippedExisting += next.entriesSkippedExisting;
  target.hiddenPreserved += next.hiddenPreserved;
  target.standardVisible += next.standardVisible;
  target.agentActors += next.agentActors;
  target.employeeActors += next.employeeActors;
  target.correlationIdPresent += next.correlationIdPresent;
  target.tasks.push(...next.tasks);
}
