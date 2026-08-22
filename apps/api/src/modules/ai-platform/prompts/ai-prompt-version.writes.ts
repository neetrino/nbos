import { BadRequestException } from '@nestjs/common';
import { assertPromptVersionTransition, type AiPromptLayers } from '@nbos/shared';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { toPromptLayerWrite } from './ai-prompt-policy.rules';

export async function nextPromptVersionNumber(
  tx: PrismaTransaction,
  policyId: string,
): Promise<number> {
  const latest = await tx.aiPromptVersion.findFirst({
    where: { policyId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

export async function retirePublishedVersions(
  tx: PrismaTransaction,
  policyId: string,
  now: Date,
): Promise<string[]> {
  const published = await tx.aiPromptVersion.findMany({
    where: { policyId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (published.length === 0) {
    return [];
  }
  await tx.aiPromptVersion.updateMany({
    where: { policyId, status: 'PUBLISHED' },
    data: { status: 'RETIRED', retiredAt: now },
  });
  return published.map((item) => item.id);
}

export async function publishPromptVersionRow(
  tx: PrismaTransaction,
  versionId: string,
  actingEmployeeId: string,
  now: Date,
): Promise<{
  contentDigest: string;
  version: number;
  policyId: string;
  retiredIds: string[];
}> {
  const version = await tx.aiPromptVersion.findUniqueOrThrow({ where: { id: versionId } });
  const denial = assertPromptVersionTransition(version.status, 'PUBLISH');
  if (denial) {
    throw new BadRequestException('Only DRAFT or TESTING prompt versions can be published');
  }
  const retiredIds = await retirePublishedVersions(tx, version.policyId, now);
  await tx.aiPromptVersion.update({
    where: { id: versionId },
    data: {
      status: 'PUBLISHED',
      publishedAt: now,
      publishedById: actingEmployeeId,
      retiredAt: null,
    },
  });
  await tx.aiPromptPolicy.update({
    where: { id: version.policyId },
    data: { status: 'ACTIVE' },
  });
  return {
    contentDigest: version.contentDigest,
    version: version.version,
    policyId: version.policyId,
    retiredIds,
  };
}

export function rollbackLayersFrom(version: {
  platformSafety: string;
  agentRole: string;
  domainRules: string | null;
  channelBehavior: string | null;
}): AiPromptLayers {
  return {
    platformSafety: version.platformSafety,
    agentRole: version.agentRole,
    domainRules: version.domainRules,
    channelBehavior: version.channelBehavior,
  };
}

export function promptPublishAuditChanges(input: {
  versionId: string;
  version: number;
  contentDigest: string;
  retiredVersionIds: string[];
}): {
  versionId: string;
  version: number;
  contentDigest: string;
  retiredVersionIds: string[];
} {
  return {
    versionId: input.versionId,
    version: input.version,
    contentDigest: input.contentDigest,
    retiredVersionIds: input.retiredVersionIds,
  };
}

export function toNewVersionData(
  policyId: string,
  version: number,
  layers: AiPromptLayers,
  createdById: string,
  predecessorVersionId?: string | null,
) {
  return {
    policyId,
    version,
    ...toPromptLayerWrite(layers),
    createdById,
    predecessorVersionId: predecessorVersionId ?? null,
  };
}
