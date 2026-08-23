import { BadRequestException } from '@nestjs/common';
import { type InputJsonValue, TaskPriorityEnum } from '@nbos/database';
import { attachTaskLinkDisplayNames } from './task-link-display-names.op';
import {
  actorProvenanceFields,
  type CreateTaskInput,
  type TaskCreatedByActor,
} from './task-create.input';
import { normalizeTaskCompletionRules } from './task-completion-rules';
import { TASK_INCLUDE } from './task-response-includes';
import { resolveTaskSprintAssignment } from './task-sprint-assign.op';
import type { TasksDbClient } from './tasks-db-client';

export interface CreateTaskOpParams {
  db: TasksDbClient;
  data: CreateTaskInput;
  code: string;
  actor?: TaskCreatedByActor;
}

/**
 * The only production Task insert. Callers supply an already reserved code so
 * the counter lock is never held inside a longer transaction (C26).
 */
export function assertCreateTaskRequiredFields(data: CreateTaskInput): void {
  if (!data.title?.trim()) throw new BadRequestException('title is required');
  if (!data.creatorId?.trim()) throw new BadRequestException('creatorId is required');
}

export async function createTask(params: CreateTaskOpParams) {
  const prepared = prepareCreateTaskFields(params.data);
  const sprintAssignment = await resolveTaskSprintAssignment(params.db, {
    workspaceId: prepared.workspaceId,
    sprintId: params.data.sprintId,
    planningStatus: params.data.planningStatus,
  });
  const task = await params.db.task.create({
    data: {
      code: params.code,
      title: prepared.title,
      creatorId: prepared.creatorId,
      description: prepared.description,
      assigneeId: prepared.assigneeId,
      coAssignees: params.data.coAssignees ?? [],
      observers: params.data.observers ?? [],
      priority: prepared.priority,
      workspaceId: prepared.workspaceId,
      sprintId: sprintAssignment.sprintId,
      planningStatus: sprintAssignment.planningStatus,
      productId: prepared.productId,
      extensionId: prepared.extensionId,
      ...(prepared.completionRules !== undefined && {
        completionRules: prepared.completionRules,
      }),
      dueDate: prepared.dueDate,
      parentId: prepared.parentId,
      isRecurring: params.data.isRecurring ?? false,
      templateTaskId: prepared.templateTaskId,
      ...actorProvenanceFields(params.actor),
      ...(prepared.links?.length && {
        links: {
          createMany: {
            data: prepared.links.map((link) => ({
              entityType: link.entityType,
              entityId: link.entityId,
            })),
          },
        },
      }),
    },
    include: TASK_INCLUDE,
  });
  await attachTaskLinkDisplayNames(params.db, [task]);
  return task;
}

interface PreparedCreateTaskFields {
  title: string;
  creatorId: string;
  description: string | undefined;
  assigneeId: string | undefined;
  priority: (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];
  workspaceId: string | undefined;
  productId: string | undefined;
  extensionId: string | undefined;
  dueDate: Date | undefined;
  parentId: string | undefined;
  templateTaskId: string | undefined;
  completionRules: InputJsonValue | undefined;
  links: Array<{ entityType: string; entityId: string }> | undefined;
}

function prepareCreateTaskFields(data: CreateTaskInput): PreparedCreateTaskFields {
  assertCreateTaskRequiredFields(data);
  return {
    title: data.title.trim(),
    creatorId: data.creatorId.trim(),
    description: data.description?.trim() || undefined,
    assigneeId: data.assigneeId?.trim() || undefined,
    priority: normalizeCreatePriority(data.priority),
    workspaceId: data.workspaceId?.trim() || undefined,
    productId: data.productId?.trim() || undefined,
    extensionId: data.extensionId?.trim() || undefined,
    dueDate: parseOptionalIsoDate('dueDate', data.dueDate),
    parentId: data.parentId?.trim() || undefined,
    templateTaskId: data.templateTaskId?.trim() || undefined,
    completionRules: parseCreateCompletionRules(data.completionRules),
    links: dedupeTaskLinks(data.links),
  };
}

function normalizeCreatePriority(
  raw: string | undefined,
): (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum] {
  const value = raw?.trim();
  const allowed = Object.values(TaskPriorityEnum);
  if (
    value &&
    allowed.includes(value as (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum])
  ) {
    return value as (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];
  }
  return TaskPriorityEnum.NORMAL;
}

function parseOptionalIsoDate(field: 'dueDate', value: string | undefined): Date | undefined {
  if (value === undefined || value === null || !String(value).trim()) return undefined;
  const parsed = new Date(String(value).trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid ${field}`);
  }
  return parsed;
}

function dedupeTaskLinks(
  links: CreateTaskInput['links'] | undefined,
): Array<{ entityType: string; entityId: string }> | undefined {
  if (!links?.length) return undefined;
  const map = new Map<string, { entityType: string; entityId: string }>();
  for (const link of links) {
    const entityType = link.entityType?.trim();
    const entityId = link.entityId?.trim();
    if (!entityType || !entityId) continue;
    map.set(`${entityType}:${entityId}`, { entityType, entityId });
  }
  const out = [...map.values()];
  return out.length ? out : undefined;
}

function parseCreateCompletionRules(input: unknown): InputJsonValue | undefined {
  if (input === undefined || input === null) return undefined;
  try {
    return normalizeTaskCompletionRules(input) as unknown as InputJsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid completionRules.';
    throw new BadRequestException(message);
  }
}
