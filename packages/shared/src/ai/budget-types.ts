export const AI_BUDGET_SCOPE_TYPES = [
  'ORGANIZATION',
  'PROVIDER',
  'INTERNAL_AGENT',
  'MODEL_POLICY',
  'DOMAIN',
] as const;

export type AiBudgetScopeType = (typeof AI_BUDGET_SCOPE_TYPES)[number];

export const AI_BUDGET_PERIODS = ['DAILY', 'MONTHLY'] as const;

export type AiBudgetPeriod = (typeof AI_BUDGET_PERIODS)[number];

export const AI_BUDGET_METRICS = ['EXECUTION_COUNT', 'ESTIMATED_COST', 'INPUT_UNITS'] as const;

export type AiBudgetMetric = (typeof AI_BUDGET_METRICS)[number];

/**
 * Hard-stop must not wrap an in-flight domain transaction. Evaluate before
 * starting a new model invocation; never after a Tasks/Drive commit.
 */
export const AI_BUDGET_BEHAVIORS = [
  'ALERT_ONLY',
  'THROTTLE',
  'DISABLE_EXPENSIVE_TIER',
  'REQUIRE_APPROVAL',
  'HARD_STOP',
] as const;

export type AiBudgetBehavior = (typeof AI_BUDGET_BEHAVIORS)[number];

export const AI_BUDGET_VERDICTS = ['WITHIN_LIMIT', 'THRESHOLD_REACHED', 'EXCEEDED'] as const;

export type AiBudgetVerdict = (typeof AI_BUDGET_VERDICTS)[number];

export function isAiBudgetScopeType(value: string): value is AiBudgetScopeType {
  return (AI_BUDGET_SCOPE_TYPES as readonly string[]).includes(value);
}

export function isAiBudgetBehavior(value: string): value is AiBudgetBehavior {
  return (AI_BUDGET_BEHAVIORS as readonly string[]).includes(value);
}

export interface AiBudgetLimitRecord {
  id: string;
  name: string;
  scopeType: AiBudgetScopeType;
  scopeId: string;
  metric: AiBudgetMetric;
  period: AiBudgetPeriod;
  ceiling: string;
  currency: string | null;
  behavior: AiBudgetBehavior;
  enabled: boolean;
}

export interface AiBudgetEvaluation {
  verdict: AiBudgetVerdict;
  behavior: AiBudgetBehavior;
  used: string;
  ceiling: string;
  remaining: string;
}
