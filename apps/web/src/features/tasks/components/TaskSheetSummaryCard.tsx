import type { ReactNode } from 'react';
import { CheckSquare, FolderKanban, Hash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Task } from '@/lib/api/tasks';
import { resolveTaskOrderContext } from '../utils/task-order-context';
import { TASK_SHEET_SECTION_SURFACE_CLASS } from './task-sheet-classes';

export function TaskSummaryCard({ task }: { task: Task }) {
  const checklistTotal = task.checklists.reduce(
    (sum, checklist) => sum + checklist.items.length,
    0,
  );
  const checklistDone = task.checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => item.checked).length,
    0,
  );
  const progress = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const orderContext = resolveTaskOrderContext(task);

  return (
    <section className={TASK_SHEET_SECTION_SURFACE_CLASS}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<CheckSquare size={15} />}
          label="Checklist"
          value={`${checklistDone}/${checklistTotal}`}
        />
        <Metric icon={<Hash size={15} />} label="Subtasks" value={String(task._count.subtasks)} />
        <Metric
          icon={<FolderKanban size={15} />}
          label="Workspace"
          value={task.workspace?.name ?? 'No workspace'}
        />
      </div>
      {checklistTotal > 0 && <Progress value={progress} className="mt-4" />}
      {orderContext && (
        <p className="text-muted-foreground mt-3 text-sm">
          <span className="text-foreground font-medium">{orderContext.orderCode}</span>
          {' · '}
          {orderContext.scopeLabel}
        </p>
      )}
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
