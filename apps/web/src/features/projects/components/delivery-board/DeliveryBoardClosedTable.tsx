'use client';

import { DeliveryBoardItemsTable } from './DeliveryBoardItemsTable';
import type { DeliveryBoardItem } from './project-delivery-board-model';

interface DeliveryBoardClosedTableProps {
  items: DeliveryBoardItem[];
  onOpenDetails: (item: DeliveryBoardItem) => void;
}

/** @deprecated Use DeliveryBoardItemsTable with mode="closed". */
export function DeliveryBoardClosedTable({ items, onOpenDetails }: DeliveryBoardClosedTableProps) {
  return <DeliveryBoardItemsTable mode="closed" items={items} onOpenDetails={onOpenDetails} />;
}
