import { EXPENSE_PLAN_MONTH_CARD_LIMIT } from './expense-plan-auto-due-scope';

export type ExpensePlanAutoDueSnapshot = {
  nextDueDate: Date | null;
  autoGenerate: boolean;
  status: string;
};

export type ExpensePlanAutoDueCard = {
  planId: string;
  expenseId: string;
};

export type ExpensePlanAutoDueFailure = {
  planId: string;
  message: string;
};

type GenerateDuePlansInput = {
  planIds: readonly string[];
  cutoff: Date;
  generateCard: (planId: string) => Promise<{ id: string }>;
  readPlanDue: (planId: string) => Promise<ExpensePlanAutoDueSnapshot | null>;
};

/**
 * Creates every occurrence still due on or before `cutoff` (current Yerevan month,
 * plus overdue dates). One plan can yield several cards (weekly, or missed months).
 */
export async function generateExpenseCardsForDuePlans(
  input: GenerateDuePlansInput,
): Promise<{ created: ExpensePlanAutoDueCard[]; failures: ExpensePlanAutoDueFailure[] }> {
  const created: ExpensePlanAutoDueCard[] = [];
  const failures: ExpensePlanAutoDueFailure[] = [];
  for (const planId of input.planIds) {
    const outcome = await generatePlanOccurrences(planId, input);
    created.push(...outcome.created);
    if (outcome.failure) failures.push(outcome.failure);
  }
  return { created, failures };
}

function planStillInsideWindow(plan: ExpensePlanAutoDueSnapshot | null, cutoff: Date): boolean {
  if (!plan || plan.status !== 'ACTIVE' || !plan.autoGenerate || !plan.nextDueDate) return false;
  return plan.nextDueDate.getTime() <= cutoff.getTime();
}

type CreateOneCardResult =
  | { ok: true; created: ExpensePlanAutoDueCard }
  | { ok: false; failure: ExpensePlanAutoDueFailure };

async function generatePlanOccurrences(
  planId: string,
  input: GenerateDuePlansInput,
): Promise<{ created: ExpensePlanAutoDueCard[]; failure?: ExpensePlanAutoDueFailure }> {
  const created: ExpensePlanAutoDueCard[] = [];
  for (let index = 0; index < EXPENSE_PLAN_MONTH_CARD_LIMIT; index += 1) {
    const card = await createOneCard(planId, input.generateCard);
    if (!card.ok) return { created, failure: card.failure };
    created.push(card.created);
    const plan = await input.readPlanDue(planId);
    if (!planStillInsideWindow(plan, input.cutoff)) return { created };
  }
  return { created };
}

async function createOneCard(
  planId: string,
  generateCard: GenerateDuePlansInput['generateCard'],
): Promise<CreateOneCardResult> {
  try {
    const expense = await generateCard(planId);
    return { ok: true, created: { planId, expenseId: expense.id } };
  } catch (caught: unknown) {
    const message =
      caught instanceof Error ? caught.message : 'Unknown error while generating card';
    return { ok: false, failure: { planId, message } };
  }
}
