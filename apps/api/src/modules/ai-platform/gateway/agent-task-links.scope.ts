import type { PrismaClient } from '@nbos/database';
import type { AiResourceTarget } from '@nbos/shared';
import type { CanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import { resolveCanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import { TASK_AGENT_PERMITTED_LINK_ENTITY_TYPES } from './agent-capability.constants';
import type { AgentTaskLinkProjection } from './agent-capability.types';
import { taskPolicyTarget, workspacePolicyTarget } from './agent-scope-target';

const PERMITTED = new Set<string>(TASK_AGENT_PERMITTED_LINK_ENTITY_TYPES);

export type LinkTargetAllowed = (target: AiResourceTarget) => Promise<boolean>;

/**
 * Omit link targets the current agent cannot already reach via grant scope.
 * Missing and out-of-scope ids are both omitted (no existence oracle).
 */
export async function toScopedAgentTaskLinks(
  prisma: InstanceType<typeof PrismaClient>,
  sourceWorkspace: CanonicalWorkSpace,
  links: Array<{ entityType: string; entityId: string }>,
  isAllowed: LinkTargetAllowed,
): Promise<AgentTaskLinkProjection[]> {
  const visible: AgentTaskLinkProjection[] = [];
  for (const link of links) {
    if (!PERMITTED.has(link.entityType)) continue;
    const target = await resolveLinkTarget(prisma, sourceWorkspace, link);
    if (!target) continue;
    if (await isAllowed(target)) {
      visible.push({ linkType: 'ENTITY', entityType: link.entityType, entityId: link.entityId });
    }
  }
  return visible;
}

async function resolveLinkTarget(
  prisma: InstanceType<typeof PrismaClient>,
  sourceWorkspace: CanonicalWorkSpace,
  link: { entityType: string; entityId: string },
): Promise<AiResourceTarget | null> {
  if (link.entityType === 'PROJECT') return projectLinkTarget(sourceWorkspace, link.entityId);
  if (link.entityType === 'PRODUCT') return productLinkTarget(sourceWorkspace, link.entityId);
  if (link.entityType === 'WORKSPACE') {
    const canonical = await resolveCanonicalWorkSpace(prisma, link.entityId);
    return canonical ? workspacePolicyTarget(canonical) : null;
  }
  if (link.entityType === 'TASK') return taskLinkTarget(prisma, link.entityId);
  return null;
}

function projectLinkTarget(workspace: CanonicalWorkSpace, entityId: string): AiResourceTarget {
  if (entityId === workspace.projectId) {
    return { projectId: entityId, workspaceId: workspace.id, productId: workspace.productId };
  }
  return { projectId: entityId };
}

function productLinkTarget(workspace: CanonicalWorkSpace, entityId: string): AiResourceTarget {
  if (entityId === workspace.productId) {
    return { productId: entityId, workspaceId: workspace.id, projectId: workspace.projectId };
  }
  return { productId: entityId };
}

async function taskLinkTarget(
  prisma: InstanceType<typeof PrismaClient>,
  taskId: string,
): Promise<AiResourceTarget | null> {
  const linked = await prisma.task.findFirst({
    where: { id: taskId, trashedAt: null },
    select: { id: true, workspaceId: true },
  });
  if (!linked?.workspaceId) return null;
  const canonical = await resolveCanonicalWorkSpace(prisma, linked.workspaceId);
  return canonical ? taskPolicyTarget(canonical, linked.id) : null;
}
