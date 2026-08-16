import { tasksApi, type TaskLink } from '@/lib/api/tasks';

/** Adds a link when missing; returns updated links (keeps picker label). */
export async function addTaskEntityLink(params: {
  taskId: string;
  links: TaskLink[];
  entityType: string;
  entityId: string;
  entityLabel: string;
}): Promise<TaskLink[]> {
  const { taskId, links, entityType, entityId, entityLabel } = params;
  if (links.some((link) => link.entityType === entityType && link.entityId === entityId)) {
    return links;
  }
  const created = await tasksApi.addLink(taskId, entityType, entityId);
  return [
    ...links,
    {
      ...created,
      entityLabel: entityLabel.trim() || created.entityLabel || null,
    },
  ];
}

/** Removes one link and returns the updated list. */
export async function removeTaskEntityLink(
  taskId: string,
  links: TaskLink[],
  linkId: string,
): Promise<TaskLink[]> {
  await tasksApi.removeLink(taskId, linkId);
  return links.filter((link) => link.id !== linkId);
}
