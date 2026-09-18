import type { Order } from '@/lib/api/finance';

export type OrderNotesDraft = {
  notes: string;
};

export type UpdateOrderGeneralPayload = {
  notes?: string | null;
};

export function createOrderNotesDraft(order: Order): OrderNotesDraft {
  return { notes: order.notes ?? '' };
}

export function buildOrderNotesPatch(
  snap: OrderNotesDraft,
  draft: OrderNotesDraft,
): UpdateOrderGeneralPayload {
  const notes = draft.notes.trim();
  const snapNotes = snap.notes.trim();
  if (notes === snapNotes) return {};
  return { notes: notes || null };
}

export function isOrderNotesDirty(a: OrderNotesDraft, b: OrderNotesDraft): boolean {
  return a.notes !== b.notes;
}
