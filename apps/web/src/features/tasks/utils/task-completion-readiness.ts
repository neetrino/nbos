import { ApiError } from '@/lib/api-errors';
import type { Task, TaskCompletionRule, TaskCompletionRuleType } from '@/lib/api/tasks';

export interface TaskCompletionBlocker {
  ruleType: TaskCompletionRuleType;
  code: string;
  message: string;
}

const RUNTIME_PENDING_RULES = new Set<TaskCompletionRuleType>([
  'requires_review',
  'requires_attachment',
  'requires_creator_approval',
  'requires_specific_field',
  'requires_linked_entity_condition',
]);

const COMPLETION_RULE_LABELS: Record<TaskCompletionRuleType, string> = {
  requires_checklist_complete: 'Checklist complete',
  requires_subtasks_complete: 'Subtasks complete',
  requires_review: 'Review required',
  requires_attachment: 'Attachment required',
  requires_creator_approval: 'Creator approval required',
  requires_specific_field: 'Required field',
  requires_linked_entity_condition: 'Linked entity condition',
};

export function getEnabledCompletionRules(task: Task): TaskCompletionRule[] {
  return (task.completionRules ?? []).filter((rule) => rule.enabled !== false);
}

export function getCompletionRuleLabel(rule: TaskCompletionRule): string {
  return rule.label ?? COMPLETION_RULE_LABELS[rule.type];
}

export function buildTaskCompletionBlockers(task: Task): TaskCompletionBlocker[] {
  return getEnabledCompletionRules(task).flatMap((rule) => buildRuleBlockers(rule, task));
}

export function parseTaskCompletionBlockers(caught: unknown): TaskCompletionBlocker[] {
  if (!(caught instanceof ApiError)) return [];
  const blockers = caught.details.blockers ?? safeParseRecord(caught.message)?.blockers;
  if (!Array.isArray(blockers)) return [];
  return blockers.filter(isTaskCompletionBlocker);
}

function buildRuleBlockers(rule: TaskCompletionRule, task: Task): TaskCompletionBlocker[] {
  if (rule.type === 'requires_checklist_complete') return buildChecklistBlockers(rule, task);
  if (rule.type === 'requires_subtasks_complete') return buildSubtaskBlockers(rule, task);
  if (RUNTIME_PENDING_RULES.has(rule.type)) return [buildRuntimePendingBlocker(rule)];
  return [];
}

function buildChecklistBlockers(rule: TaskCompletionRule, task: Task): TaskCompletionBlocker[] {
  const itemCount = task.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);
  const uncheckedCount = task.checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => !item.checked).length,
    0,
  );

  if (itemCount === 0) return [buildBlocker(rule, 'CHECKLIST_MISSING', 'Checklist is required.')];
  if (uncheckedCount === 0) return [];
  return [
    buildBlocker(rule, 'CHECKLIST_INCOMPLETE', `${uncheckedCount} checklist item(s) remain open.`),
  ];
}

function buildSubtaskBlockers(rule: TaskCompletionRule, task: Task): TaskCompletionBlocker[] {
  const openSubtasks = task.subtasks.filter(
    (subtask) => !['COMPLETED', 'DONE'].includes(subtask.status),
  );
  if (openSubtasks.length === 0) return [];
  return [buildBlocker(rule, 'SUBTASKS_OPEN', `${openSubtasks.length} subtask(s) remain open.`)];
}

function buildRuntimePendingBlocker(rule: TaskCompletionRule): TaskCompletionBlocker {
  return buildBlocker(
    rule,
    'RUNTIME_NOT_AVAILABLE',
    `${getCompletionRuleLabel(rule)} is not available yet.`,
  );
}

function buildBlocker(
  rule: TaskCompletionRule,
  code: string,
  message: string,
): TaskCompletionBlocker {
  return { ruleType: rule.type, code, message };
}

function safeParseRecord(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isTaskCompletionBlocker(value: unknown): value is TaskCompletionBlocker {
  return (
    isRecord(value) &&
    isTaskCompletionRuleType(value.ruleType) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

function isTaskCompletionRuleType(value: unknown): value is TaskCompletionRuleType {
  return typeof value === 'string' && value in COMPLETION_RULE_LABELS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
