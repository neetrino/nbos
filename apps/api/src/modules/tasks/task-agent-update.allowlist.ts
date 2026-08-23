/**
 * Agent `tasks.update` field allowlist derived from TasksService domain rules,
 * not from any agent-facing DTO.
 *
 * `UpdateTaskDto` can patch many columns. Semantic workflow, assignment,
 * scope, personal-board and security fields stay off this list so a granted
 * `tasks.update` cannot impersonate `tasks.start` / submit-review / delete or
 * reassign the task to another Work Space.
 */
export const TASK_AGENT_UPDATE_ALLOWED_FIELDS = [
  'title',
  'description',
  'priority',
  'dueDate',
] as const;

export type TaskAgentUpdateAllowedField = (typeof TASK_AGENT_UPDATE_ALLOWED_FIELDS)[number];

const ALLOWED = new Set<string>(TASK_AGENT_UPDATE_ALLOWED_FIELDS);

/** True when `field` is a business content field agents may patch. */
export function isTaskAgentUpdateAllowedField(field: string): field is TaskAgentUpdateAllowedField {
  return ALLOWED.has(field);
}

/**
 * Fields that exist on `UpdateTaskDto` / `TasksService.update` and must never
 * be accepted from an External Agent through `tasks.update`.
 */
export const TASK_AGENT_UPDATE_FORBIDDEN_FIELDS = [
  'status',
  'workspaceId',
  'sprintId',
  'planningStatus',
  'workspaceSortOrder',
  'creatorId',
  'assigneeId',
  'reviewerId',
  'coAssignees',
  'observers',
  'parentId',
  'myPlanStageId',
  'myPlanSortOrder',
  'completionRules',
] as const;
