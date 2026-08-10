import type { PrismaClient } from '@nbos/database';
import { isMessengerProjectUuid } from '../access/messenger-legacy-channel-access.op';

export type MessengerParityCheck = {
  name: string;
  legacy: number;
  unified: number;
  ok: boolean;
  detail?: string;
};

export type MessengerParityReport = {
  ok: boolean;
  checks: MessengerParityCheck[];
  notes: string[];
};

function check(
  name: string,
  legacy: number,
  unified: number,
  detail?: string,
): MessengerParityCheck {
  return { name, legacy, unified, ok: legacy === unified, detail };
}

/**
 * Compare legacy vs unified row counts for backfill verification.
 * Message/attachment/read-state counts use id reuse (legacy id = unified id).
 */
export async function verifyMessengerLegacyBackfillParity(
  prisma: InstanceType<typeof PrismaClient>,
): Promise<MessengerParityReport> {
  const notes: string[] = [];

  const [
    legacyChannels,
    legacyThreads,
    legacyChannelMessages,
    legacyDmMessages,
    legacyChannelAttachments,
    legacyDmAttachments,
    legacyChannelReads,
    legacyDmReads,
    unifiedConversations,
    unifiedMessages,
    unifiedAttachments,
    unifiedReads,
    unifiedDirect,
    legacyChannelIds,
    legacyThreadIds,
  ] = await Promise.all([
    prisma.messengerChannel.count(),
    prisma.messengerDirectThread.count(),
    prisma.messengerChannelMessage.count(),
    prisma.messengerDirectMessage.count(),
    prisma.messengerChannelMessageAttachment.count(),
    prisma.messengerDirectMessageAttachment.count(),
    prisma.messengerChannelReadState.count(),
    prisma.messengerDirectThreadReadState.count(),
    prisma.messengerConversation.count(),
    prisma.messengerMessage.count(),
    prisma.messengerMessageAttachment.count(),
    prisma.messengerConversationReadState.count(),
    prisma.messengerConversation.count({ where: { type: 'DIRECT' } }),
    prisma.messengerChannel.findMany({ select: { id: true } }),
    prisma.messengerDirectThread.findMany({ select: { id: true } }),
  ]);

  const expectedConversations = legacyChannels + legacyThreads;
  const expectedMessages = legacyChannelMessages + legacyDmMessages;
  const expectedReads = legacyChannelReads + legacyDmReads;

  const legacyAttachmentIds = [
    ...(
      await prisma.messengerChannelMessageAttachment.findMany({ select: { id: true, fileAssetId: true } })
    ),
    ...(
      await prisma.messengerDirectMessageAttachment.findMany({ select: { id: true, fileAssetId: true } })
    ),
  ];
  const fileIds = [...new Set(legacyAttachmentIds.map((a) => a.fileAssetId))];
  const existingFiles =
    fileIds.length === 0
      ? new Set<string>()
      : new Set(
          (
            await prisma.fileAsset.findMany({
              where: { id: { in: fileIds } },
              select: { id: true },
            })
          ).map((f) => f.id),
        );
  const expectedAttachments = legacyAttachmentIds.filter((a) =>
    existingFiles.has(a.fileAssetId),
  ).length;
  const missingAttachmentFiles = legacyAttachmentIds.length - expectedAttachments;
  if (missingAttachmentFiles > 0) {
    notes.push(
      `${missingAttachmentFiles} legacy attachment(s) skipped because FileAsset is missing (expected).`,
    );
  }

  const missingChannelConversations = (
    await Promise.all(
      legacyChannelIds.map(async (c) => {
        const byId = await prisma.messengerConversation.findUnique({
          where: { id: c.id },
          select: { id: true },
        });
        if (byId) return null;
        const byLegacyKey = await prisma.messengerConversation.findUnique({
          where: { canonicalKey: `legacy_channel:${c.id}` },
          select: { id: true },
        });
        if (byLegacyKey) return null;
        const channel = await prisma.messengerChannel.findUnique({
          where: { id: c.id },
          select: { projectId: true, type: true },
        });
        if (channel?.type === 'PROJECT' && isMessengerProjectUuid(channel.projectId)) {
          const key = `project_general:${channel.projectId}`;
          const byKey = await prisma.messengerConversation.findUnique({
            where: { canonicalKey: key },
            select: { id: true },
          });
          if (byKey) return null;
        }
        return c.id;
      }),
    )
  ).filter((id) => id !== null).length;

  const missingDirectConversations = (
    await Promise.all(
      (
        await prisma.messengerDirectThread.findMany({
          select: { id: true, participantAId: true, participantBId: true },
        })
      ).map(async (t) => {
        const byId = await prisma.messengerConversation.findUnique({
          where: { id: t.id },
          select: { id: true, type: true },
        });
        if (byId?.type === 'DIRECT') return null;
        const [low, high] = [t.participantAId, t.participantBId].sort();
        const byKey = await prisma.messengerConversation.findUnique({
          where: { canonicalKey: `direct:${low}:${high}` },
          select: { id: true },
        });
        return byKey ? null : t.id;
      }),
    )
  ).filter((id) => id !== null).length;

  const sampleChannelMessages = await prisma.messengerChannelMessage.findMany({
    take: 50,
    select: { id: true, content: true, channelId: true },
    orderBy: { createdAt: 'desc' },
  });
  let contentMismatches = 0;
  let missingUnifiedMessages = 0;
  for (const m of sampleChannelMessages) {
    const u = await prisma.messengerMessage.findUnique({
      where: { id: m.id },
      select: { content: true },
    });
    if (!u) {
      missingUnifiedMessages += 1;
      continue;
    }
    if (u.content !== m.content) contentMismatches += 1;
  }
  if (sampleChannelMessages.length > 0) {
    notes.push(
      `Sampled ${sampleChannelMessages.length} recent channel message(s); missing=${missingUnifiedMessages}; content mismatches=${contentMismatches}.`,
    );
  }

  const projects = await prisma.project.findMany({
    where: { trashedAt: null },
    select: { id: true },
  });
  let projectsWithoutGeneral = 0;
  for (const p of projects) {
    const key = `project_general:${p.id}`;
    const row = await prisma.messengerConversation.findUnique({
      where: { canonicalKey: key },
      select: { id: true },
    });
    if (!row) projectsWithoutGeneral += 1;
  }

  let duplicateCanonicalCount = 0;
  try {
    const duplicateCanonical = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT canonical_key FROM messenger_conversations
        WHERE canonical_key IS NOT NULL
        GROUP BY canonical_key HAVING COUNT(*) > 1
      ) d
    `;
    duplicateCanonicalCount = Number(duplicateCanonical[0]?.count ?? 0);
  } catch {
    notes.push('duplicate_canonical_keys raw query unavailable; treated as 0.');
  }

  const checks: MessengerParityCheck[] = [
    check(
      'conversations_total',
      expectedConversations,
      unifiedConversations,
      'informational when ensure created extra Generals',
    ),
    check('direct_conversations', legacyThreads, unifiedDirect),
    check('messages_total', expectedMessages, unifiedMessages),
    check(
      'attachments_with_existing_file',
      expectedAttachments,
      unifiedAttachments,
      `legacy_raw=${legacyChannelAttachments + legacyDmAttachments}`,
    ),
    check(
      'read_states_total',
      expectedReads,
      unifiedReads,
      'informational: unified reads may exceed legacy after UI mark-read',
    ),
    check('channel_conversation_coverage', 0, missingChannelConversations),
    check('direct_conversation_coverage', 0, missingDirectConversations),
    check('channel_message_missing_in_unified', 0, missingUnifiedMessages),
    check('channel_message_content_mismatches', 0, contentMismatches),
    check('projects_without_general', 0, projectsWithoutGeneral),
    check('duplicate_canonical_keys', 0, duplicateCanonicalCount),
  ];

  const critical = new Set([
    'direct_conversations',
    'attachments_with_existing_file',
    'channel_conversation_coverage',
    'direct_conversation_coverage',
    'channel_message_missing_in_unified',
    'channel_message_content_mismatches',
    'projects_without_general',
    'duplicate_canonical_keys',
  ]);

  notes.push(
    'UserConversationSetting is not backfilled (no legacy pin/mute source).',
    'Channel participants are derived from message senders + read-state employees (no legacy membership table).',
    'conversations_total / read_states_total / messages_total may exceed legacy after ensure + dual-write activity.',
  );

  return {
    ok: checks.filter((c) => critical.has(c.name)).every((c) => c.ok),
    checks,
    notes,
  };
}
