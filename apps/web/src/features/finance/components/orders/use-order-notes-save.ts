import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  buildOrderNotesPatch,
  createOrderNotesDraft,
  isOrderNotesDirty,
  type OrderNotesDraft,
} from '@/features/finance/utils/order-notes-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ordersApi, type Order } from '@/lib/api/finance';

const ORDER_NOTES_SAVE_FAILED = 'Could not save order notes.';
const ORDER_NOTES_UPDATED = 'Order updated.';

function useOrderNotesDraft(order: Order | null) {
  const orderId = order?.id ?? '';
  const [trackedId, setTrackedId] = useState(orderId);
  const [draft, setDraft] = useState<OrderNotesDraft | null>(() =>
    order ? createOrderNotesDraft(order) : null,
  );
  const [snap, setSnap] = useState<OrderNotesDraft | null>(() =>
    order ? createOrderNotesDraft(order) : null,
  );
  if (trackedId !== orderId) {
    setTrackedId(orderId);
    const next = order ? createOrderNotesDraft(order) : null;
    setDraft(next);
    setSnap(next);
  }

  const patchDraft = useCallback((partial: Partial<OrderNotesDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const dirty = draft != null && snap != null && isOrderNotesDirty(draft, snap);
  return { draft, snap, setDraft, setSnap, patchDraft, dirty };
}

export function useOrderNotesSave(order: Order | null, onSaved: (updated: Order) => void) {
  const notes = useOrderNotesDraft(order);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    if (!order || !notes.draft || !notes.snap) return;
    const patch = buildOrderNotesPatch(notes.snap, notes.draft);
    if (Object.keys(patch).length === 0) return;
    const draftAtSave = notes.draft;
    const snapAtSave = notes.snap;
    notes.setSnap({ ...draftAtSave });
    setError(null);
    setSaving(true);
    void ordersApi
      .updateGeneral(order.id, patch)
      .then((updated) => {
        const next = createOrderNotesDraft(updated);
        notes.setDraft(next);
        notes.setSnap(next);
        onSaved(updated);
        toast.success(ORDER_NOTES_UPDATED);
      })
      .catch((caught: unknown) => {
        notes.setSnap(snapAtSave);
        notes.setDraft(draftAtSave);
        setError(getApiErrorMessage(caught, ORDER_NOTES_SAVE_FAILED));
      })
      .finally(() => setSaving(false));
  }, [notes, onSaved, order]);

  const handleCancel = useCallback(() => {
    setError(null);
    if (notes.snap) notes.setDraft({ ...notes.snap });
  }, [notes]);

  return {
    draft: notes.draft,
    patchDraft: notes.patchDraft,
    dirty: notes.dirty,
    saving,
    error,
    handleSave,
    handleCancel,
  };
}
