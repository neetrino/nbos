import type { AiResourceTarget } from '@nbos/shared';
import type { CanonicalWorkSpace } from '../../tasks/work-space-canonical.op';

export function workspacePolicyTarget(workspace: CanonicalWorkSpace): AiResourceTarget {
  return {
    workspaceId: workspace.id,
    productId: workspace.productId,
    projectId: workspace.projectId,
  };
}

export function taskPolicyTarget(workspace: CanonicalWorkSpace, taskId: string): AiResourceTarget {
  return {
    ...workspacePolicyTarget(workspace),
    resourceType: 'TASK',
    resourceId: taskId,
  };
}
