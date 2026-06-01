import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';

const STORAGE_KEY = 'nbos:finance:orders-board-view';

export function readOrdersBoardViewMode(): OrderViewMode {
  if (typeof window === 'undefined') {
    return 'list';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'board' ? 'board' : 'list';
}

export function writeOrdersBoardViewMode(mode: OrderViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
