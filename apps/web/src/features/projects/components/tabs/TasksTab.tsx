'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared';
import { tasksApi, type Task } from '@/lib/api/tasks';
import type { ProjectOrder } from '@/lib/api/projects';
import { getTaskStatus, getTaskPriority } from '@/features/tasks/constants/tasks';
import { resolveTaskOrderContext } from '@/features/tasks/utils/task-order-context';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { ProjectTaskKanbanCard } from './ProjectTaskKanbanCard';

const TASK_ORDER_QUERY = 'taskOrder';
const ALL_ORDERS_VALUE = 'all';

interface TasksTabProps {
  projectId: string;
  orders: Pick<ProjectOrder, 'id' | 'code'>[];
}

const KANBAN_COLUMNS = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'ON_HOLD', 'COMPLETED'] as const;

export function TasksTab({ projectId, orders }: TasksTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderFromUrl = searchParams.get(TASK_ORDER_QUERY);

  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const validOrderIds = useMemo(() => new Set(orders.map((o) => o.id)), [orders]);

  const selectedOrderFilter = useMemo(() => {
    if (!orderFromUrl || !validOrderIds.has(orderFromUrl)) {
      return ALL_ORDERS_VALUE;
    }
    return orderFromUrl;
  }, [orderFromUrl, validOrderIds]);

  const setOrderFilter = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === ALL_ORDERS_VALUE) {
        next.delete(TASK_ORDER_QUERY);
      } else {
        next.set(TASK_ORDER_QUERY, value);
      }
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (orderFromUrl && orders.length > 0 && !validOrderIds.has(orderFromUrl)) {
      setOrderFilter(ALL_ORDERS_VALUE);
    }
  }, [orderFromUrl, orders.length, validOrderIds, setOrderFilter]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const orderId = selectedOrderFilter === ALL_ORDERS_VALUE ? undefined : selectedOrderFilter;
      const data = await tasksApi.getAll({
        projectId,
        orderId,
        pageSize: 200,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setTasks(data.items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedOrderFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      /* ignore */
    }
  };

  const openTask = (taskId: string) => {
    setSheetTaskId(taskId);
    setSheetOpen(true);
  };

  const activeTasks = tasks;
  const doneTasks = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const totalActive = activeTasks.length;

  if (loading) {
    return <div className="text-muted-foreground py-12 text-center text-sm">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        {selectedOrderFilter === ALL_ORDERS_VALUE
          ? 'No tasks in this project yet.'
          : 'No tasks for this order in this project.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          {orders.length > 0 && (
            <div className="max-w-xs space-y-1">
              <Label className="text-muted-foreground text-xs">Order</Label>
              <Select
                value={selectedOrderFilter}
                onValueChange={(v) => {
                  if (v === null) return;
                  setOrderFilter(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All orders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ORDERS_VALUE}>All orders</SelectItem>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {doneTasks}/{totalActive} completed
          </span>
          <div className="bg-secondary h-2 w-32 rounded-full">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${totalActive > 0 ? (doneTasks / totalActive) * 100 : 0}%` }}
            />
          </div>
          <div className="border-border flex rounded-lg border">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('kanban')}
              className="rounded-r-none"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              <List size={14} />
            </Button>
          </div>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => {
              if (col === 'OPEN') return t.status === 'OPEN' || t.status === 'NEW';
              if (col === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'DONE';
              return t.status === col;
            });
            const st = getTaskStatus(col);
            return (
              <div key={col} className="bg-muted/30 min-w-[220px] flex-1 rounded-xl p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: st?.color?.replace('bg-', '') ?? '#888' }}
                    />
                    <span className="text-xs font-semibold">{st?.label ?? col}</span>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <ProjectTaskKanbanCard
                      key={task.id}
                      task={task}
                      onOpen={() => openTask(task.id)}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Task</th>
                <th className="px-4 py-2 text-left font-medium">Order</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Priority</th>
                <th className="px-4 py-2 text-left font-medium">Assignee</th>
                <th className="px-4 py-2 text-left font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {activeTasks.map((task) => {
                const st = getTaskStatus(task.status);
                const pr = getTaskPriority(task.priority);
                const orderCtx = resolveTaskOrderContext(task);
                return (
                  <tr
                    key={task.id}
                    className="border-border hover:bg-muted/40 cursor-pointer border-t"
                    onClick={() => openTask(task.id)}
                  >
                    <td className="px-4 py-2">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-muted-foreground text-xs">{task.code}</p>
                    </td>
                    <td className="text-muted-foreground px-4 py-2 text-xs">
                      {orderCtx ? (
                        <span>
                          <span className="text-foreground font-medium">{orderCtx.orderCode}</span>
                          <span className="block">{orderCtx.scopeLabel}</span>
                        </span>
                      ) : (
                        '\u2014'
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </td>
                    <td className="px-4 py-2">
                      {pr && <StatusBadge label={pr.label} variant={pr.variant} />}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {task.assignee
                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                        : '\u2014'}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '\u2014'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskSheet
        taskId={sheetTaskId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
        onDelete={(taskId) => {
          setTasks((prev) => prev.filter((task) => task.id !== taskId));
          setSheetOpen(false);
        }}
      />
    </div>
  );
}
