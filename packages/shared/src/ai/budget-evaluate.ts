import type { AiBudgetEvaluation, AiBudgetLimitRecord } from './budget-types';

const ALERT_RATIO = 0.8;

function parseAmount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Compares current period usage against a configured ceiling.
 * Does not persist, charge, or start domain work.
 */
export function evaluateAiBudget(
  limit: AiBudgetLimitRecord,
  usedAmount: string,
): AiBudgetEvaluation {
  const used = parseAmount(usedAmount);
  const ceiling = parseAmount(limit.ceiling);
  const remaining = Math.max(0, ceiling - used);
  if (used > ceiling) {
    return {
      verdict: 'EXCEEDED',
      behavior: limit.behavior,
      used: formatAmount(used),
      ceiling: formatAmount(ceiling),
      remaining: '0',
    };
  }
  if (ceiling > 0 && used >= ceiling * ALERT_RATIO) {
    return {
      verdict: 'THRESHOLD_REACHED',
      behavior: limit.behavior,
      used: formatAmount(used),
      ceiling: formatAmount(ceiling),
      remaining: formatAmount(remaining),
    };
  }
  return {
    verdict: 'WITHIN_LIMIT',
    behavior: limit.behavior,
    used: formatAmount(used),
    ceiling: formatAmount(ceiling),
    remaining: formatAmount(remaining),
  };
}

/** True when a new model invocation must not start. */
export function shouldHardStopAiBudget(evaluation: AiBudgetEvaluation): boolean {
  return evaluation.behavior === 'HARD_STOP' && evaluation.verdict === 'EXCEEDED';
}
