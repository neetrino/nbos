import type { AgentTaskProjection, AgentWorkspaceProjection } from './agent-capability.types';
import type { CanonicalWorkSpace } from '../../tasks/work-space-canonical.op';

export function toAgentWorkspaceProjection(
  workspace: CanonicalWorkSpace,
): AgentWorkspaceProjection {
  return {
    id: workspace.id,
    name: workspace.name,
    type: workspace.type,
    projectId: workspace.projectId,
    productId: workspace.productId,
    scrumEnabled: workspace.scrumEnabled,
  };
}

export function toAgentTaskProjection(task: {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  workspaceId?: string | null;
  sprintId?: string | null;
  updatedAt?: Date | string | null;
  reviewRequestedAt?: Date | string | null;
}): AgentTaskProjection {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: toIso(task.dueDate),
    workspaceId: task.workspaceId ?? null,
    sprintId: task.sprintId ?? null,
    updatedAt: toIso(task.updatedAt),
    reviewRequestedAt: toIso(task.reviewRequestedAt),
  };
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}
