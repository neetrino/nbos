import type { AiPromptPolicyStatus, AiPromptVersionStatus } from '@nbos/shared';

export interface AiPromptVersionView {
  id: string;
  policyId: string;
  version: number;
  status: AiPromptVersionStatus;
  platformSafety: string;
  agentRole: string;
  domainRules: string | null;
  channelBehavior: string | null;
  contentDigest: string;
  createdById: string;
  publishedAt: Date | null;
  predecessorVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiPromptPolicyView {
  id: string;
  name: string;
  purpose: string | null;
  status: AiPromptPolicyStatus;
  ownerId: string;
  createdById: string;
  publishedVersionId: string | null;
  versions: AiPromptVersionView[];
  createdAt: Date;
  updatedAt: Date;
}

export function toPromptVersionView(version: AiPromptVersionView): AiPromptVersionView {
  return {
    id: version.id,
    policyId: version.policyId,
    version: version.version,
    status: version.status,
    platformSafety: version.platformSafety,
    agentRole: version.agentRole,
    domainRules: version.domainRules,
    channelBehavior: version.channelBehavior,
    contentDigest: version.contentDigest,
    createdById: version.createdById,
    publishedAt: version.publishedAt,
    predecessorVersionId: version.predecessorVersionId,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

export function toPromptPolicyView(
  policy: Omit<AiPromptPolicyView, 'versions' | 'publishedVersionId'>,
  versions: AiPromptVersionView[],
): AiPromptPolicyView {
  const published = versions.find((item) => item.status === 'PUBLISHED') ?? null;
  return {
    id: policy.id,
    name: policy.name,
    purpose: policy.purpose,
    status: policy.status,
    ownerId: policy.ownerId,
    createdById: policy.createdById,
    publishedVersionId: published?.id ?? null,
    versions: [...versions].sort((left, right) => left.version - right.version),
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}
