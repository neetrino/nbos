import type { PrismaClient } from '@nbos/database';
import { buildMessengerCanonicalKey } from '../access/messenger-canonical.util';
import { ensureProjectGeneralConversation } from '../unified/messenger-conversation-ensure.ops';

export type MessengerProjectGeneralReconcileCounts = {
  projectsTotal: number;
  projectsWithGeneral: number;
  projectsMissingGeneral: number;
  created: number;
  alreadyOk: number;
  legacyProjectChannelsMatched: number;
  potentialLegacyIdCollision: number;
  blocked: number;
};

export type MessengerProjectGeneralReconcileResult = {
  mode: 'dry-run' | 'apply';
  counts: MessengerProjectGeneralReconcileCounts;
  missingProjectIds: string[];
  warnings: string[];
};

/**
 * Idempotent gap-fill: every non-trashed Project gets exactly one PROJECT_GENERAL.
 * Detects legacy channel id vs ensure UUID collision risks without merging here
 * (legacy backfill handles message merge into existing canonical).
 */
export async function reconcileProjectGeneralConversations(
  prisma: InstanceType<typeof PrismaClient>,
  options: { mode: 'dry-run' | 'apply' },
): Promise<MessengerProjectGeneralReconcileResult> {
  const warnings: string[] = [];
  const projects = await prisma.project.findMany({
    where: { trashedAt: null },
    select: { id: true, name: true, code: true },
    orderBy: { createdAt: 'asc' },
  });

  const missingProjectIds: string[] = [];
  let projectsWithGeneral = 0;
  let created = 0;
  let legacyProjectChannelsMatched = 0;
  let potentialLegacyIdCollision = 0;
  let blocked = 0;

  for (const project of projects) {
    const canonicalKey = buildMessengerCanonicalKey('PROJECT_GENERAL', project.id);
    const existing = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: { id: true },
    });

    const legacyChannels = await prisma.messengerChannel.findMany({
      where: { projectId: project.id, type: 'PROJECT' },
      select: { id: true },
    });
    if (legacyChannels.length > 0) legacyProjectChannelsMatched += 1;

    if (existing) {
      projectsWithGeneral += 1;
      for (const ch of legacyChannels) {
        if (ch.id !== existing.id) {
          const legacyRow = await prisma.messengerConversation.findUnique({
            where: { id: ch.id },
            select: { id: true, canonicalKey: true },
          });
          if (legacyRow && legacyRow.canonicalKey && legacyRow.canonicalKey !== canonicalKey) {
            potentialLegacyIdCollision += 1;
            warnings.push(
              `Project ${project.id}: canonical General ${existing.id} coexists with legacy-id row ${ch.id} (key=${legacyRow.canonicalKey}).`,
            );
          } else if (legacyRow && legacyRow.canonicalKey === canonicalKey) {
            blocked += 1;
            warnings.push(
              `BLOCKED Project ${project.id}: duplicate rows share canonicalKey ${canonicalKey} (ids ${existing.id} vs ${ch.id}).`,
            );
          }
        }
      }
      continue;
    }

    missingProjectIds.push(project.id);
    for (const ch of legacyChannels) {
      const legacyRow = await prisma.messengerConversation.findUnique({
        where: { id: ch.id },
        select: { id: true, canonicalKey: true },
      });
      if (legacyRow) {
        potentialLegacyIdCollision += 1;
        warnings.push(
          `Project ${project.id}: missing canonical General but legacy-id conversation ${ch.id} exists (key=${legacyRow.canonicalKey ?? 'null'}).`,
        );
      }
    }

    if (options.mode === 'apply') {
      await ensureProjectGeneralConversation(prisma, {
        projectId: project.id,
        createdById: null,
        title: project.name,
      });
      created += 1;
      projectsWithGeneral += 1;
    }
  }

  const projectsMissingGeneral =
    options.mode === 'apply' ? 0 : missingProjectIds.length;

  return {
    mode: options.mode,
    counts: {
      projectsTotal: projects.length,
      projectsWithGeneral:
        options.mode === 'apply' ? projects.length : projectsWithGeneral,
      projectsMissingGeneral,
      created,
      alreadyOk: projects.length - missingProjectIds.length,
      legacyProjectChannelsMatched,
      potentialLegacyIdCollision,
      blocked,
    },
    missingProjectIds: options.mode === 'apply' ? [] : missingProjectIds,
    warnings,
  };
}
