import type { InputJsonValue, PrismaClient } from '@nbos/database';
import { isMessengerProjectUuid } from '../access/messenger-legacy-channel-access.op';
import {
  planLegacyChannelConversation,
  planLegacyDirectConversation,
  type LegacyChannelType,
} from './messenger-legacy-backfill-mapping';
import { resolveChannelConversationTarget } from './messenger-legacy-backfill-resolve';

export type MessengerBackfillCounts = {
  conversations: number;
  participants: number;
  links: number;
  messages: number;
  attachments: number;
  readStates: number;
  channelsProcessed: number;
  directsProcessed: number;
  skippedAttachmentsMissingFile: number;
  reconciledIntoExistingCanonical: number;
  blockedConflicts: number;
};

export type MessengerBackfillResult = {
  mode: 'dry-run' | 'apply';
  counts: MessengerBackfillCounts;
  warnings: string[];
};

function emptyCounts(): MessengerBackfillCounts {
  return {
    conversations: 0,
    participants: 0,
    links: 0,
    messages: 0,
    attachments: 0,
    readStates: 0,
    channelsProcessed: 0,
    directsProcessed: 0,
    skippedAttachmentsMissingFile: 0,
    reconciledIntoExistingCanonical: 0,
    blockedConflicts: 0,
  };
}

async function projectExistsMap(
  prisma: InstanceType<typeof PrismaClient>,
  projectIds: string[],
): Promise<Set<string>> {
  const uuids = [...new Set(projectIds.filter(isMessengerProjectUuid))];
  if (uuids.length === 0) return new Set();
  const rows = await prisma.project.findMany({
    where: { id: { in: uuids } },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

async function existingPrimaryProjectIds(
  prisma: InstanceType<typeof PrismaClient>,
): Promise<Set<string>> {
  const rows = await prisma.messengerConversationLink.findMany({
    where: { entityType: 'PROJECT', relationType: 'PRIMARY' },
    select: { entityId: true },
  });
  return new Set(rows.map((r) => r.entityId));
}

/**
 * Idempotent copy of legacy channels/DMs into unified messenger tables.
 * Reuses legacy row ids when no canonical conversation exists yet.
 * When ensure already created a canonical row, migrates messages into that id.
 */
export async function runMessengerLegacyBackfill(
  prisma: InstanceType<typeof PrismaClient>,
  options: { mode: 'dry-run' | 'apply' },
): Promise<MessengerBackfillResult> {
  const counts = emptyCounts();
  const warnings: string[] = [];
  const apply = options.mode === 'apply';

  const channels = await prisma.messengerChannel.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { attachments: true },
      },
      readStates: true,
    },
  });

  const existingProjects = await projectExistsMap(
    prisma,
    channels.map((c) => c.projectId),
  );
  const claimedPrimary = await existingPrimaryProjectIds(prisma);

  for (const channel of channels) {
    counts.channelsProcessed += 1;
    const plan = planLegacyChannelConversation({
      channelId: channel.id,
      name: channel.name,
      projectId: channel.projectId,
      type: channel.type as LegacyChannelType,
      primaryProjectIdsClaimed: claimedPrimary,
      projectExists: existingProjects.has(channel.projectId),
    });

    if (plan.primaryProjectId) {
      claimedPrimary.add(plan.primaryProjectId);
    }

    const senderIds = new Set(channel.messages.map((m) => m.senderId));
    const readerIds = new Set(channel.readStates.map((r) => r.employeeId));
    const participantIds = new Set([...senderIds, ...readerIds]);
    const lastMessageAt =
      channel.messages.length > 0
        ? channel.messages[channel.messages.length - 1]!.createdAt
        : null;
    const createdById = channel.messages[0]?.senderId ?? null;

    counts.conversations += 1;
    counts.participants += participantIds.size;
    if (plan.primaryProjectId || plan.relatedProjectId) counts.links += 1;
    counts.messages += channel.messages.length;
    counts.readStates += channel.readStates.length;

    if (!apply) {
      for (const msg of channel.messages) {
        counts.attachments += msg.attachments.length;
      }
      const preview = await resolveChannelConversationTarget(prisma, plan);
      if (!preview.ok) {
        counts.blockedConflicts += 1;
        warnings.push(`Channel ${channel.id}: ${preview.reason}`);
      } else if (preview.reconciled) {
        counts.reconciledIntoExistingCanonical += 1;
        warnings.push(
          `Channel ${channel.id}: would reconcile into existing canonical ${preview.conversationId}`,
        );
      }
      continue;
    }

    const target = await resolveChannelConversationTarget(prisma, plan);
    if (!target.ok) {
      counts.blockedConflicts += 1;
      warnings.push(`Channel ${channel.id}: ${target.reason}`);
      continue;
    }
    if (target.reconciled) {
      counts.reconciledIntoExistingCanonical += 1;
      warnings.push(
        `Channel ${channel.id}: reconciled into existing canonical conversation ${target.conversationId}`,
      );
    }

    const conversationId = target.conversationId;

    if (target.createWithLegacyId) {
      await prisma.messengerConversation.upsert({
        where: { id: conversationId },
        create: {
          id: conversationId,
          type: plan.type,
          title: plan.title,
          status: 'ACTIVE',
          createdById,
          canonicalKey: plan.canonicalKey,
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          createdAt: channel.createdAt,
          updatedAt: channel.createdAt,
        },
        update: {
          type: plan.type,
          title: plan.title,
          canonicalKey: plan.canonicalKey,
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          createdById,
        },
      });
    } else {
      await prisma.messengerConversation.update({
        where: { id: conversationId },
        data: {
          title: plan.title,
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          ...(createdById ? { createdById } : {}),
        },
      });
    }

    for (const employeeId of participantIds) {
      await prisma.messengerConversationParticipant.upsert({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId,
          },
        },
        create: {
          conversationId,
          employeeId,
          role: 'MEMBER',
          joinedAt: channel.createdAt,
        },
        update: {
          leftAt: null,
          role: 'MEMBER',
        },
      });
    }

    if (plan.primaryProjectId) {
      await prisma.messengerConversationLink.upsert({
        where: {
          conversationId_entityType_entityId_relationType: {
            conversationId,
            entityType: 'PROJECT',
            entityId: plan.primaryProjectId,
            relationType: 'PRIMARY',
          },
        },
        create: {
          conversationId,
          entityType: 'PROJECT',
          entityId: plan.primaryProjectId,
          relationType: 'PRIMARY',
        },
        update: {},
      });
    } else if (plan.relatedProjectId) {
      await prisma.messengerConversationLink.upsert({
        where: {
          conversationId_entityType_entityId_relationType: {
            conversationId,
            entityType: 'PROJECT',
            entityId: plan.relatedProjectId,
            relationType: 'RELATED',
          },
        },
        create: {
          conversationId,
          entityType: 'PROJECT',
          entityId: plan.relatedProjectId,
          relationType: 'RELATED',
        },
        update: {},
      });
      warnings.push(
        `Channel ${channel.id} mapped as INTERNAL_GROUP with RELATED project ${plan.relatedProjectId} (PRIMARY already claimed).`,
      );
    }

    for (const msg of channel.messages) {
      await prisma.messengerMessage.upsert({
        where: { id: msg.id },
        create: {
          id: msg.id,
          conversationId,
          senderId: msg.senderId,
          senderNameSnapshot: msg.senderNameSnapshot,
          content: msg.content,
          messageType: 'TEXT',
          editedAt: msg.editedAt,
          createdAt: msg.createdAt,
          updatedAt: msg.editedAt ?? msg.createdAt,
        },
        update: {
          conversationId,
          senderId: msg.senderId,
          senderNameSnapshot: msg.senderNameSnapshot,
          content: msg.content,
          editedAt: msg.editedAt,
        },
      });

      for (const att of msg.attachments) {
        const file = await prisma.fileAsset.findUnique({
          where: { id: att.fileAssetId },
          select: { id: true },
        });
        if (!file) {
          counts.skippedAttachmentsMissingFile += 1;
          warnings.push(
            `Skipped channel attachment ${att.id}: missing FileAsset ${att.fileAssetId}`,
          );
          continue;
        }
        counts.attachments += 1;
        await prisma.messengerMessageAttachment.upsert({
          where: { id: att.id },
          create: {
            id: att.id,
            messageId: msg.id,
            fileAssetId: att.fileAssetId,
            attachedById: att.attachedById,
            createdAt: att.createdAt,
          },
          update: {
            messageId: msg.id,
            fileAssetId: att.fileAssetId,
            attachedById: att.attachedById,
          },
        });
      }
    }

    for (const rs of channel.readStates) {
      const existingRead = await prisma.messengerConversationReadState.findUnique({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId: rs.employeeId,
          },
        },
        select: { lastReadAt: true },
      });
      const mergedLastReadAt =
        existingRead && existingRead.lastReadAt > rs.lastReadAt
          ? existingRead.lastReadAt
          : rs.lastReadAt;
      await prisma.messengerConversationReadState.upsert({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId: rs.employeeId,
          },
        },
        create: {
          conversationId,
          employeeId: rs.employeeId,
          lastReadAt: rs.lastReadAt,
        },
        update: { lastReadAt: mergedLastReadAt },
      });
    }
  }

  const threads = await prisma.messengerDirectThread.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { attachments: true },
      },
      readStates: true,
    },
  });

  for (const thread of threads) {
    counts.directsProcessed += 1;
    const plan = planLegacyDirectConversation({
      threadId: thread.id,
      participantAId: thread.participantAId,
      participantBId: thread.participantBId,
    });
    const lastMessageAt =
      thread.messages.length > 0 ? thread.messages[thread.messages.length - 1]!.createdAt : null;
    const createdById = thread.messages[0]?.senderId ?? null;

    counts.conversations += 1;
    counts.participants += 2;
    counts.messages += thread.messages.length;
    counts.readStates += thread.readStates.length;

    if (!apply) {
      for (const msg of thread.messages) {
        counts.attachments += msg.attachments.length;
      }
      const preview = await resolveChannelConversationTarget(prisma, plan);
      if (!preview.ok) {
        counts.blockedConflicts += 1;
        warnings.push(`DM thread ${thread.id}: ${preview.reason}`);
      } else if (preview.reconciled) {
        counts.reconciledIntoExistingCanonical += 1;
        warnings.push(
          `DM thread ${thread.id}: would reconcile into existing canonical ${preview.conversationId}`,
        );
      }
      continue;
    }

    const target = await resolveChannelConversationTarget(prisma, plan);
    if (!target.ok) {
      counts.blockedConflicts += 1;
      warnings.push(`DM thread ${thread.id}: ${target.reason}`);
      continue;
    }
    if (target.reconciled) {
      counts.reconciledIntoExistingCanonical += 1;
      warnings.push(
        `DM thread ${thread.id}: reconciled into existing canonical conversation ${target.conversationId}`,
      );
    }
    const conversationId = target.conversationId;

    if (target.createWithLegacyId) {
      await prisma.messengerConversation.upsert({
        where: { id: conversationId },
        create: {
          id: conversationId,
          type: 'DIRECT',
          title: null,
          status: 'ACTIVE',
          createdById,
          canonicalKey: plan.canonicalKey,
          directParticipantLowId: plan.directParticipantLowId,
          directParticipantHighId: plan.directParticipantHighId,
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          createdAt: thread.createdAt,
          updatedAt: thread.createdAt,
        },
        update: {
          type: 'DIRECT',
          canonicalKey: plan.canonicalKey,
          directParticipantLowId: plan.directParticipantLowId,
          directParticipantHighId: plan.directParticipantHighId,
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          createdById,
        },
      });
    } else {
      await prisma.messengerConversation.update({
        where: { id: conversationId },
        data: {
          metadata: plan.metadata as InputJsonValue,
          lastMessageAt,
          directParticipantLowId: plan.directParticipantLowId,
          directParticipantHighId: plan.directParticipantHighId,
          ...(createdById ? { createdById } : {}),
        },
      });
    }

    for (const employeeId of [plan.directParticipantLowId, plan.directParticipantHighId]) {
      await prisma.messengerConversationParticipant.upsert({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId,
          },
        },
        create: {
          conversationId,
          employeeId,
          role: 'MEMBER',
          joinedAt: thread.createdAt,
        },
        update: { leftAt: null, role: 'MEMBER' },
      });
    }

    for (const msg of thread.messages) {
      await prisma.messengerMessage.upsert({
        where: { id: msg.id },
        create: {
          id: msg.id,
          conversationId,
          senderId: msg.senderId,
          senderNameSnapshot: msg.senderNameSnapshot,
          content: msg.content,
          messageType: 'TEXT',
          editedAt: msg.editedAt,
          createdAt: msg.createdAt,
          updatedAt: msg.editedAt ?? msg.createdAt,
        },
        update: {
          conversationId,
          senderId: msg.senderId,
          senderNameSnapshot: msg.senderNameSnapshot,
          content: msg.content,
          editedAt: msg.editedAt,
        },
      });

      for (const att of msg.attachments) {
        const file = await prisma.fileAsset.findUnique({
          where: { id: att.fileAssetId },
          select: { id: true },
        });
        if (!file) {
          counts.skippedAttachmentsMissingFile += 1;
          warnings.push(`Skipped DM attachment ${att.id}: missing FileAsset ${att.fileAssetId}`);
          continue;
        }
        counts.attachments += 1;
        await prisma.messengerMessageAttachment.upsert({
          where: { id: att.id },
          create: {
            id: att.id,
            messageId: msg.id,
            fileAssetId: att.fileAssetId,
            attachedById: att.attachedById,
            createdAt: att.createdAt,
          },
          update: {
            messageId: msg.id,
            fileAssetId: att.fileAssetId,
            attachedById: att.attachedById,
          },
        });
      }
    }

    for (const rs of thread.readStates) {
      const existingRead = await prisma.messengerConversationReadState.findUnique({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId: rs.employeeId,
          },
        },
        select: { lastReadAt: true },
      });
      const mergedLastReadAt =
        existingRead && existingRead.lastReadAt > rs.lastReadAt
          ? existingRead.lastReadAt
          : rs.lastReadAt;
      await prisma.messengerConversationReadState.upsert({
        where: {
          conversationId_employeeId: {
            conversationId,
            employeeId: rs.employeeId,
          },
        },
        create: {
          conversationId,
          employeeId: rs.employeeId,
          lastReadAt: rs.lastReadAt,
        },
        update: { lastReadAt: mergedLastReadAt },
      });
    }
  }

  return { mode: options.mode, counts, warnings };
}
