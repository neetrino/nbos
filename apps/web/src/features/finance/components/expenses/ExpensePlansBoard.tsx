'use client';

import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { buildExpensePlansKanbanColumns } from '@/features/finance/constants/expense-plans-board-columns';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { ExpensePlanBoardCard } from './ExpensePlanBoardCard';
import { translateExpensePlanFrequency, useExpensePlansT } from './expense-plan-message-keys';

export interface ExpensePlansBoardProps {
  plans: ExpensePlan[];
  onOpen: (plan: ExpensePlan) => void;
}

export function ExpensePlansBoard({ plans, onOpen }: ExpensePlansBoardProps) {
  const t = useExpensePlansT();
  const columns = buildExpensePlansKanbanColumns(plans, (key) =>
    translateExpensePlanFrequency(t, key),
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <KanbanBoard
        columns={columns}
        getItemId={(p) => p.id}
        columnWidth={270}
        emptyMessage={t('empty.boardColumn')}
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal column={column} getAmount={(plan) => plan.amount} />
        )}
        renderCard={(plan) => <ExpensePlanBoardCard plan={plan} onOpen={onOpen} />}
      />
    </div>
  );
}
