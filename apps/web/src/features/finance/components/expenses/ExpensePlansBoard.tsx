'use client';

import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { buildExpensePlansKanbanColumns } from '@/features/finance/constants/expense-plans-board-columns';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { ExpensePlanBoardCard } from './ExpensePlanBoardCard';

export interface ExpensePlansBoardProps {
  plans: ExpensePlan[];
  onOpen: (plan: ExpensePlan) => void;
}

export function ExpensePlansBoard({ plans, onOpen }: ExpensePlansBoardProps) {
  const columns = buildExpensePlansKanbanColumns(plans);

  return (
    <KanbanBoard
      columns={columns}
      getItemId={(p) => p.id}
      columnWidth={270}
      emptyMessage="No plans in this frequency column."
      renderColumnHeader={(column) => (
        <KanbanColumnMoneyTotal column={column} getAmount={(plan) => plan.amount} />
      )}
      renderCard={(plan) => <ExpensePlanBoardCard plan={plan} onOpen={onOpen} />}
    />
  );
}
