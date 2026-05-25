import { toDateInputValue } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { Expense, UpdateExpensePayload } from '@/lib/api/finance';

export interface ExpenseGeneralDraft {
  name: string;
  amount: string;
  type: string;
  category: string;
  frequency: string;
  status: string;
  dueDate: string;
  projectId: string;
  isPassThrough: boolean;
  taxStatus: string;
  backlogReason: string;
  notes: string;
}

export function createExpenseGeneralDraft(expense: Expense): ExpenseGeneralDraft {
  return {
    name: expense.name,
    amount: String(parseFloat(expense.amount)),
    type: expense.type,
    category: expense.category,
    frequency: expense.frequency,
    status: expense.status,
    dueDate: toDateInputValue(expense.dueDate),
    projectId: expense.projectId ?? 'none',
    isPassThrough: expense.isPassThrough,
    taxStatus: expense.taxStatus,
    backlogReason: expense.backlogReason ?? 'none',
    notes: expense.notes ?? '',
  };
}

export function parseExpenseDraftAmount(raw: string): number | null {
  const amount = parseFloat(raw.replace(/\s/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function canSubmitExpenseGeneralDraft(draft: ExpenseGeneralDraft): boolean {
  return Boolean(draft.name.trim()) && parseExpenseDraftAmount(draft.amount) != null;
}

function backlogReasonFromDraft(draft: ExpenseGeneralDraft): string | null {
  if (draft.status !== 'BACKLOG') return null;
  return draft.backlogReason === 'none' ? null : draft.backlogReason;
}

export function buildExpenseGeneralPatch(
  snap: ExpenseGeneralDraft,
  draft: ExpenseGeneralDraft,
): Partial<UpdateExpensePayload> {
  const out: Partial<UpdateExpensePayload> = {};

  const name = draft.name.trim();
  if (name && name !== snap.name.trim()) out.name = name;

  const amount = parseExpenseDraftAmount(draft.amount);
  const snapAmount = parseExpenseDraftAmount(snap.amount);
  if (amount != null && amount !== snapAmount) out.amount = amount;

  if (draft.type !== snap.type) out.type = draft.type;
  if (draft.category !== snap.category) out.category = draft.category;
  if (draft.frequency !== snap.frequency) out.frequency = draft.frequency;
  if (draft.status !== snap.status) out.status = draft.status;

  const dueDate = draft.dueDate.trim();
  const snapDue = snap.dueDate.trim();
  if (dueDate !== snapDue) out.dueDate = dueDate ? dueDate : null;

  const projectId = draft.projectId !== 'none' ? draft.projectId : null;
  const snapProjectId = snap.projectId !== 'none' ? snap.projectId : null;
  if (projectId !== snapProjectId) out.projectId = projectId;

  if (draft.isPassThrough !== snap.isPassThrough) out.isPassThrough = draft.isPassThrough;
  if (draft.taxStatus !== snap.taxStatus) out.taxStatus = draft.taxStatus;

  const backlogReason = backlogReasonFromDraft(draft);
  const snapBacklogReason = backlogReasonFromDraft(snap);
  if (backlogReason !== snapBacklogReason) out.backlogReason = backlogReason;

  const notes = draft.notes.trim();
  const snapNotes = snap.notes.trim();
  if (notes !== snapNotes) out.notes = notes || null;

  return out;
}

export function isExpenseGeneralDirty(a: ExpenseGeneralDraft, b: ExpenseGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
