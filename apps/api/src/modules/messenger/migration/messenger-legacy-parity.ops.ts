import type { PrismaClient } from '@nbos/database';

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
      legacyChannelIds.map((c) =>
        prisma.messengerConversation.findUnique({ where: { id: c.id }, select: { id: true } }),
      ),
    )
  ).filter((row) => !row).length;

  const missingDirectConversations = (
    await Promise.all(
      legacyThreadIds.map((t) =>
        prisma.messengerConversation.findUnique({
          where: { id: t.id },
          select: { id: true, type: true },
        }),
      ),
    )
  ).filter((row) => !row || row.type !== 'DIRECT').length;

  const sampleChannelMessages = await prisma.messengerChannelMessage.findMany({
    take: 50,
    select: { id: true, content: true, channelId: true },
    orderBy: { createdAt: 'desc' },
  });
  let contentMismatches = 0;
  for (const m of sampleChannelMessages) {
    const u = await prisma.messengerMessage.findUnique({
      where: { id: m.id },
      select: { content: true, conversationId: true },
    });
    if (!u || u.content !== m.content || u.conversationId !== m.channelId) {
      contentMismatches += 1;
    }
  }
  if (sampleChannelMessages.length > 0) {
    notes.push(
      `Sampled ${sampleChannelMessages.length} recent channel message(s); content/id mismatches=${contentMismatches}.`,
    );
  }

  const checks: MessengerParityCheck[] = [
    check('conversations_total', expectedConversations, unifiedConversations),
    check('direct_conversations', legacyThreads, unifiedDirect),
    check('messages_total', expectedMessages, unifiedMessages),
    check(
      'attachments_with_existing_file',
      expectedAttachments,
      unifiedAttachments,
      `legacy_raw=${legacyChannelAttachments + legacyDmAttachments}`,
    ),
    check('read_states_total', expectedReads, unifiedReads),
    check('channel_conversation_id_coverage', 0, missingChannelConversations),
    check('direct_conversation_id_coverage', 0, missingDirectConversations),
    check('channel_message_sample_mismatches', 0, contentMismatches),
  ];

  notes.push(
    'UserConversationSetting is not backfilled (no legacy pin/mute source).',
    'Channel participants are derived from message senders + read-state employees (no legacy membership table).',
  );

  return {
    ok: checks.every((c) => c.ok),
    checks,
    notes,
  };
}
