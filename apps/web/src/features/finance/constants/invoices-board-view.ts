'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { InvoiceViewMode } from '@/features/finance/components/invoices/invoice-page-types';

const invoicesBoardViewStore = createPersistedScalarStore<InvoiceViewMode>({
  storageKey: 'nbos:finance:invoices-board-view',
  defaultValue: 'kanban',
  parse: (raw) => (raw === 'list' ? 'list' : 'kanban'),
});

export const readInvoicesBoardViewMode = invoicesBoardViewStore.read;
export const writeInvoicesBoardViewMode = invoicesBoardViewStore.write;
export const useInvoicesBoardViewMode = invoicesBoardViewStore.useValue;
