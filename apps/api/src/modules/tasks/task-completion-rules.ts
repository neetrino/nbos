export const TASK_COMPLETION_RULE_TYPES = [
  'requires_checklist_complete',
  'requires_subtasks_complete',
  'requires_review',
  'requires_attachment',
  'requires_creator_approval',
  'requires_specific_field',
  'requires_linked_entity_condition',
] as const;

export type TaskCompletionRuleType = (typeof TASK_COMPLETION_RULE_TYPES)[number];

export interface TaskCompletionRule {
  type: TaskCompletionRuleType;
  enabled: boolean;
  label?: string;
}

export interface TaskCompletionBlocker {
  ruleType: TaskCompletionRuleType;
  code: string;
  message: string;
}

interface TaskForCompletionRules {
  status: string;
  reviewApprovedAt?: Date | string | null;
  completionRules?: unknown;
  checklists: Array<{ items: Array<{ checked: boolean }> }>;
  subtasks: Array<{ code: string; title: string; status: string }>;
}

const RUNTIME_PENDING_RULES = new Set<TaskCompletionRuleType>([
  'requires_attachment',
  'requires_creator_approval',
  'requires_specific_field',
  'requires_linked_entity_condition',
]);

export function normalizeTaskCompletionRules(input: unknown): TaskCompletionRule[] {
  if (input === null || input === undefined) return [];
  if (!Array.isArray(input)) throw new Error('completionRules must be an array.');

  return input.map((rule) => normalizeRule(rule));
}

export function buildTaskCompletionBlockers(task: TaskForCompletionRules): TaskCompletionBlocker[] {
  const rules = safeNormalizeStoredRules(task.completionRules).filter((rule) => rule.enabled);
  return rules.flatMap((rule) => buildRuleBlockers(rule, task));
}

function normalizeRule(rule: unknown): TaskCompletionRule {
  if (typeof rule === 'string') return buildRule(rule, true);
  if (!isRecord(rule)) throw new Error('completionRules items must be strings or objects.');

  const type = String(rule.type ?? '');
  const enabled = rule.enabled === undefined ? true : Boolean(rule.enabled);
  const label = typeof rule.label === 'string' ? rule.label.trim() : undefined;
  return buildRule(type, enabled, label || undefined);
}

function buildRule(type: string, enabled: boolean, label?: string): TaskCompletionRule {
  if (!isTaskCompletionRuleType(type)) throw new Error(`Unsupported completion rule: ${type}`);
  return { type, enabled, ...(label && { label }) };
}

function buildRuleBlockers(
  rule: TaskCompletionRule,
  task: TaskForCompletionRules,
): TaskCompletionBlocker[] {
  if (rule.type === 'requires_checklist_complete') return buildChecklistBlockers(rule, task);
  if (rule.type === 'requires_subtasks_complete') return buildSubtaskBlockers(rule, task);
  if (rule.type === 'requires_review') return buildReviewBlockers(rule, task);
  if (RUNTIME_PENDING_RULES.has(rule.type)) return [buildRuntimePendingBlocker(rule)];
  return [];
}

function buildChecklistBlockers(
  rule: TaskCompletionRule,
  task: TaskForCompletionRules,
): TaskCompletionBlocker[] {
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

function buildReviewBlockers(
  rule: TaskCompletionRule,
  task: TaskForCompletionRules,
): TaskCompletionBlocker[] {
  if (task.reviewApprovedAt) return [];
  if (task.status !== 'REVIEW') {
    return [
      buildBlocker(rule, 'REVIEW_NOT_REQUESTED', 'Submit the task for review before completing.'),
    ];
  }
  return [
    buildBlocker(rule, 'REVIEW_NOT_APPROVED', 'Review approval is required before completing.'),
  ];
}

function buildSubtaskBlockers(
  rule: TaskCompletionRule,
  task: TaskForCompletionRules,
): TaskCompletionBlocker[] {
  const openSubtasks = task.subtasks.filter((subtask) => subtask.status !== 'COMPLETED');
  if (openSubtasks.length === 0) return [];
  return [buildBlocker(rule, 'SUBTASKS_OPEN', `${openSubtasks.length} subtask(s) remain open.`)];
}

function buildRuntimePendingBlocker(rule: TaskCompletionRule): TaskCompletionBlocker {
  return buildBlocker(
    rule,
    'RUNTIME_NOT_AVAILABLE',
    `${rule.label ?? rule.type} is not available yet.`,
  );
}

function buildBlocker(
  rule: TaskCompletionRule,
  code: string,
  message: string,
): TaskCompletionBlocker {
  return { ruleType: rule.type, code, message };
}

function safeNormalizeStoredRules(input: unknown) {
  try {
    return normalizeTaskCompletionRules(input);
  } catch {
    return [];
  }
}

function isTaskCompletionRuleType(value: string): value is TaskCompletionRuleType {
  return TASK_COMPLETION_RULE_TYPES.includes(value as TaskCompletionRuleType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
