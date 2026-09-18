import type { OrderNotesDraft } from '@/features/finance/utils/order-notes-form-state';
import type { Order } from '@/lib/api/finance';
import { OrderGeneralTab } from './OrderGeneralTab';
import { OrderInvoicesTab } from './OrderInvoicesTab';
import { OrderReconciliationTab } from './OrderReconciliationTab';
import type { OrderDetailSheetTab } from './order-detail-sheet-tabs';

export function OrderDetailSheetBody({
  activeTab,
  order,
  notesDraft,
  patchNotesDraft,
  notesDisabled,
  onCreateInvoice,
}: {
  activeTab: OrderDetailSheetTab;
  order: Order;
  notesDraft: OrderNotesDraft;
  patchNotesDraft: (partial: Partial<OrderNotesDraft>) => void;
  notesDisabled: boolean;
  onCreateInvoice: () => void;
}) {
  if (activeTab === 'general') {
    return (
      <OrderGeneralTab
        order={order}
        draft={notesDraft}
        patchDraft={patchNotesDraft}
        formDisabled={notesDisabled}
      />
    );
  }
  if (activeTab === 'invoices') {
    return <OrderInvoicesTab order={order} onCreateInvoice={onCreateInvoice} />;
  }
  return <OrderReconciliationTab order={order} />;
}
