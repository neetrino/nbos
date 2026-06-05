'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';

const ordersBoardViewStore = createPersistedScalarStore<OrderViewMode>({
  storageKey: 'nbos:finance:orders-board-view',
  defaultValue: 'list',
  parse: (raw) => (raw === 'board' ? 'board' : 'list'),
});

export const readOrdersBoardViewMode = ordersBoardViewStore.read;
export const writeOrdersBoardViewMode = ordersBoardViewStore.write;
export const useOrdersBoardViewMode = ordersBoardViewStore.useValue;
