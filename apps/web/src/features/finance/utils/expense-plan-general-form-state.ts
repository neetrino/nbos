import type { CreateExpensePlanPayload } from '@/lib/api/expense-plans';
import {
  expensePlanToFormState,
  type ExpensePlanFormState,
} from '@/features/finance/utils/expense-plan-form-state';

export type ExpensePlanGeneralDraft = ExpensePlanFormState;

export function createExpensePlanGeneralDraft(
  plan: Parameters<typeof expensePlanToFormState>[0],
): ExpensePlanGeneralDraft {
  return expensePlanToFormState(plan);
}

function parseDraftAmount(raw: string): number | null {
  const amount = parseFloat(raw.replace(/\s/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function buildExpensePlanGeneralPatch(
  snap: ExpensePlanGeneralDraft,
  draft: ExpensePlanGeneralDraft,
): Partial<CreateExpensePlanPayload> {
  const out: Partial<CreateExpensePlanPayload> = {};

  const name = draft.name.trim();
  if (name && name !== snap.name.trim()) out.name = name;

  const amount = parseDraftAmount(draft.amount);
  const snapAmount = parseDraftAmount(snap.amount);
  if (amount != null && amount !== snapAmount) out.amount = amount;

  if (draft.category !== snap.category) out.category = draft.category;
  if (draft.frequency !== snap.frequency) out.frequency = draft.frequency;

  const nextDue = draft.nextDueDate.trim();
  const snapDue = snap.nextDueDate.trim();
  if (nextDue !== snapDue) out.nextDueDate = nextDue ? nextDue : null;

  const provider = draft.provider.trim();
  const snapProvider = snap.provider.trim();
  if (provider !== snapProvider) out.provider = provider || null;

  const projectId = draft.projectId !== 'none' ? draft.projectId : null;
  const snapProjectId = snap.projectId !== 'none' ? snap.projectId : null;
  if (projectId !== snapProjectId) out.projectId = projectId;

  if (draft.autoGenerate !== snap.autoGenerate) out.autoGenerate = draft.autoGenerate;

  const notes = draft.notes.trim();
  const snapNotes = snap.notes.trim();
  if (notes !== snapNotes) out.notes = notes || null;

  return out;
}

export function isExpensePlanGeneralDirty(
  a: ExpensePlanGeneralDraft,
  b: ExpensePlanGeneralDraft,
): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
