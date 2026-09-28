const MONEY_CENTS = 100;

export type ExpenseBonusDraft = {
  bonusReleaseId: string;
  amountText: string;
};

export type ExpenseBonusAssignmentPlan = {
  valid: boolean;
  salaryPart: string;
  leftover: string;
  carryPart: string;
  unassigned: string;
  bonusAssignments: { bonusReleaseId: string; amount: string }[];
  carryAmount?: string;
};

/** Splits a payroll cash amount into salary, named bonuses, and earlier carry. */
export function planExpenseBonusAssignments(input: {
  amountText: string;
  salaryRemaining: string;
  carryRemaining: string;
  bonuses: { bonusReleaseId: string; remaining: string }[];
  drafts: ExpenseBonusDraft[];
  carryDraft?: string;
}): ExpenseBonusAssignmentPlan {
  const payment = moneyCents(input.amountText);
  const salaryRemaining = moneyCents(input.salaryRemaining);
  const carryRemaining = moneyCents(input.carryRemaining);
  const empty = emptyPlan();
  if (payment == null || payment <= 0 || salaryRemaining == null || carryRemaining == null) {
    return empty;
  }
  const salaryPart = Math.min(payment, salaryRemaining);
  const leftover = payment - salaryPart;
  const parsed = parseDrafts(input.drafts, input.bonuses);
  if (parsed != null && parsed.assigned === 0 && leftover > 0) {
    const namedCarry = namedCarryPlan(salaryPart, leftover, carryRemaining, input.carryDraft);
    if (namedCarry != null) return namedCarry;
    return {
      ...empty,
      salaryPart: formatCents(salaryPart),
      leftover: formatCents(leftover),
      unassigned: formatCents(leftover),
    };
  }
  if (parsed == null)
    return { ...empty, salaryPart: formatCents(salaryPart), leftover: formatCents(leftover) };
  if (parsed.assigned > leftover) {
    return { ...empty, salaryPart: formatCents(salaryPart), leftover: formatCents(leftover) };
  }
  const afterBonus = leftover - parsed.assigned;
  if (afterBonus > carryRemaining) {
    return {
      ...empty,
      salaryPart: formatCents(salaryPart),
      leftover: formatCents(leftover),
      unassigned: formatCents(afterBonus - carryRemaining),
    };
  }
  return {
    valid: true,
    salaryPart: formatCents(salaryPart),
    leftover: formatCents(leftover),
    carryPart: formatCents(afterBonus),
    unassigned: formatCents(0),
    bonusAssignments: parsed.assignments,
  };
}

function emptyPlan(): ExpenseBonusAssignmentPlan {
  return {
    valid: false,
    salaryPart: '0.00',
    leftover: '0.00',
    carryPart: '0.00',
    unassigned: '0.00',
    bonusAssignments: [],
  };
}

function namedCarryPlan(
  salaryPart: number,
  leftover: number,
  carryRemaining: number,
  carryDraft: string | undefined,
): ExpenseBonusAssignmentPlan | null {
  const requested = moneyCents(carryDraft ?? '');
  if (requested == null || requested !== leftover || requested > carryRemaining) return null;
  return {
    valid: true,
    salaryPart: formatCents(salaryPart),
    leftover: formatCents(leftover),
    carryPart: formatCents(requested),
    unassigned: formatCents(0),
    bonusAssignments: [],
    carryAmount: formatCents(requested),
  };
}

function parseDrafts(
  drafts: ExpenseBonusDraft[],
  bonuses: { bonusReleaseId: string; remaining: string }[],
): { assigned: number; assignments: { bonusReleaseId: string; amount: string }[] } | null {
  const remainingById = new Map(
    bonuses.map((bonus) => [bonus.bonusReleaseId, moneyCents(bonus.remaining)]),
  );
  const assignments: { bonusReleaseId: string; amount: string }[] = [];
  let assigned = 0;
  for (const draft of drafts) {
    const amount = moneyCents(draft.amountText);
    const cap = remainingById.get(draft.bonusReleaseId);
    if (amount == null || cap == null || amount > cap) return null;
    if (amount === 0) continue;
    assigned += amount;
    assignments.push({ bonusReleaseId: draft.bonusReleaseId, amount: formatCents(amount) });
  }
  return { assigned, assignments };
}

function moneyCents(text: string): number | null {
  const trimmed = text.trim().replace(/\s/g, '').replace(',', '.');
  if (trimmed.length === 0) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole = '', frac = ''] = trimmed.split('.');
  if (whole.length === 0 || whole.length > 12) return null;
  return Number(whole) * MONEY_CENTS + Number(frac.padEnd(2, '0'));
}

function formatCents(cents: number): string {
  const whole = Math.trunc(cents / MONEY_CENTS);
  const frac = String(Math.abs(cents % MONEY_CENTS)).padStart(2, '0');
  return `${whole}.${frac}`;
}
