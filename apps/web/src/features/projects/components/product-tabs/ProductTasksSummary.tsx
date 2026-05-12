import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Flame, PlayCircle } from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

interface ProductTasksSummaryProps {
  tasks: Task[];
}

export function ProductTasksSummary({ tasks }: ProductTasksSummaryProps) {
  const stats = getTaskStats(tasks);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <SummaryCard
        icon={CheckCircle2}
        label="Completion"
        value={`${stats.done}/${stats.active}`}
        detail={`${stats.completion}% complete`}
      >
        <progress
          value={stats.completion}
          max={100}
          aria-label="Task completion"
          className="mt-2 h-1 w-full overflow-hidden rounded-full"
        />
      </SummaryCard>
      <SummaryCard icon={PlayCircle} label="In progress" value={String(stats.inProgress)} />
      <SummaryCard icon={Flame} label="High priority" value={String(stats.highPriority)} />
      <SummaryCard
        icon={stats.overdue > 0 ? AlertTriangle : Clock}
        label="Overdue"
        value={String(stats.overdue)}
        tone={stats.overdue > 0 ? 'danger' : 'default'}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
  children,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'danger';
  children?: ReactNode;
}) {
  const iconClassName = tone === 'danger' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="bg-card border-border rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <Icon size={14} className={iconClassName} />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {detail && <p className="text-muted-foreground text-xs">{detail}</p>}
      {children}
    </div>
  );
}

function getTaskStats(tasks: Task[]) {
  const done = tasks.filter((task) => task.status === 'DONE' || task.status === 'COMPLETED').length;
  const activeTasks = tasks.filter((task) => task.status !== 'COMPLETED' && task.status !== 'DONE');
  const active = tasks.length;
  return {
    active,
    done,
    completion: active > 0 ? Math.round((done / active) * 100) : 0,
    inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    highPriority: tasks.filter((task) => task.priority === 'CRITICAL' || task.priority === 'HIGH')
      .length,
    overdue: activeTasks.filter(isOverdue).length,
  };
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === 'DONE' || task.status === 'COMPLETED') return false;
  return new Date(task.dueDate).getTime() < startOfToday().getTime();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
