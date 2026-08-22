/**
 * HTTP/create payload. Actor provenance is never accepted from the client body.
 */
export interface CreateTaskInput {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  workspaceId?: string;
  sprintId?: string | null;
  planningStatus?: string;
  completionRules?: unknown;
  dueDate?: string;
  parentId?: string;
  links?: Array<{ entityType: string; entityId: string }>;
  isRecurring?: boolean;
  templateTaskId?: string;
}

/** Trusted actor recorded on create. Only the gateway (or tests) may pass this. */
export interface TaskCreatedByActor {
  type: string;
  id: string;
}

export function actorProvenanceFields(actor: TaskCreatedByActor | undefined): {
  createdByActorType?: string;
  createdByActorId?: string;
} {
  const actorType = actor?.type.trim();
  const actorId = actor?.id.trim();
  if (!actorType || !actorId) return {};
  return { createdByActorType: actorType, createdByActorId: actorId };
}

/** Copies known create fields and drops forged actor provenance keys. */
export function createTaskInputFromHttpBody(body: CreateTaskInput): CreateTaskInput {
  return {
    title: body.title,
    creatorId: body.creatorId,
    description: body.description,
    assigneeId: body.assigneeId,
    coAssignees: body.coAssignees,
    observers: body.observers,
    priority: body.priority,
    workspaceId: body.workspaceId,
    sprintId: body.sprintId,
    planningStatus: body.planningStatus,
    completionRules: body.completionRules,
    dueDate: body.dueDate,
    parentId: body.parentId,
    links: body.links,
    isRecurring: body.isRecurring,
    templateTaskId: body.templateTaskId,
  };
}
