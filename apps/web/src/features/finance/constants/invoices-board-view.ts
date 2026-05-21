import type { InvoiceViewMode } from '@/features/finance/components/invoices/invoice-page-types';

const STORAGE_KEY = 'nbos:finance:invoices-board-view';

export function readInvoicesBoardViewMode(): InvoiceViewMode {
  if (typeof window === 'undefined') {
    return 'kanban';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'list' ? 'list' : 'kanban';
}

export function writeInvoicesBoardViewMode(mode: InvoiceViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
