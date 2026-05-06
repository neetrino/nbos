'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/shared';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getApiErrorMessage } from '@/lib/api-errors';
import { getTaskStatus, getTaskPriority } from '../constants/tasks';
import { resolveTaskOrderContext } from '../utils/task-order-context';
import { TaskActionButtons } from './TaskActionButtons';
import { TaskChatPlaceholder } from './TaskChatPlaceholder';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCompletionRulesPanel } from './TaskCompletionRulesPanel';
import { TaskDatesSection, TaskLinksSection, TaskPeopleSection } from './TaskDetailsSections';
import { TaskSubtasksSection } from './TaskSubtasksSection';
import {
  parseTaskCompletionBlockers,
  type TaskCompletionBlocker,
} from '../utils/task-completion-readiness';

interface TaskSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskSheet({ taskId, open, onOpenChange, onUpdate }: TaskSheetProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [completionBlockers, setCompletionBlockers] = useState<TaskCompletionBlocker[]>([]);

  useEffect(() => {
    if (!taskId || !open) return;
    let cancelled = false;

    async function loadTask() {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const nextTask = await tasksApi.getById(taskId!);
        if (!cancelled) {
          setTask(nextTask);
          setActionError(null);
          setCompletionBlockers([]);
        }
      } catch {
        /* handled */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTask();
    return () => {
      cancelled = true;
    };
  }, [taskId, open]);

  const handleAction = async (action: 'start' | 'complete' | 'reopen' | 'defer') => {
    if (!task) return;
    try {
      const updated =
        action === 'start'
          ? await tasksApi.start(task.id)
          : action === 'complete'
            ? await tasksApi.complete(task.id)
            : action === 'reopen'
              ? await tasksApi.reopen(task.id)
              : await tasksApi.defer(task.id);
      setTask(updated);
      setActionError(null);
      setCompletionBlockers([]);
      onUpdate?.(updated);
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Task action could not be completed.'));
      if (action === 'complete') setCompletionBlockers(parseTaskCompletionBlockers(caught));
    }
  };

  const handleAddChecklist = async () => {
    if (!task || !newChecklistTitle.trim()) return;
    try {
      const cl = await tasksApi.createChecklist(task.id, newChecklistTitle.trim());
      setTask((prev) => (prev ? { ...prev, checklists: [...prev.checklists, cl] } : prev));
      setNewChecklistTitle('');
    } catch {}
  };

  const handleAddItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      const item = await tasksApi.addChecklistItem(checklistId, text);
      setTask((prev) =>
        prev
          ? {
              ...prev,
              checklists: prev.checklists.map((cl) =>
                cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl,
              ),
            }
          : prev,
      );
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch {}
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    try {
      const updated = await tasksApi.toggleChecklistItem(itemId);
      setTask((prev) =>
        prev
          ? {
              ...prev,
              checklists: prev.checklists.map((cl) =>
                cl.id === checklistId
                  ? { ...cl, items: cl.items.map((it) => (it.id === itemId ? updated : it)) }
                  : cl,
              ),
            }
          : prev,
      );
    } catch {}
  };

  if (!task && !loading) return null;

  const status = task ? getTaskStatus(task.status) : null;
  const priority = task ? getTaskPriority(task.priority) : null;
  const orderContext = task ? resolveTaskOrderContext(task) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-4xl flex-col p-0 sm:max-w-4xl">
        <SheetHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{loading ? 'Loading...' : task?.title}</SheetTitle>
            {task && (
              <div className="flex items-center gap-2">
                <TaskActionButtons task={task} onAction={handleAction} />
              </div>
            )}
          </div>
        </SheetHeader>

        {task && (
          <div className="flex flex-1 overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {status && <StatusBadge label={status.label} variant={status.variant} />}
                  {priority && <StatusBadge label={priority.label} variant={priority.variant} />}
                  <Badge variant="outline">{task.code}</Badge>
                </div>

                {orderContext && (
                  <div>
                    <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      Order context
                    </h4>
                    <p className="text-sm">
                      <span className="font-medium">{orderContext.orderCode}</span>
                      <span className="text-muted-foreground"> · {orderContext.scopeLabel}</span>
                    </p>
                  </div>
                )}

                {task.description && (
                  <div>
                    <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      Description
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                <Separator />

                <TaskPeopleSection task={task} />
                <TaskDatesSection task={task} />

                <Separator />

                <TaskCompletionRulesPanel task={task} serverBlockers={completionBlockers} />

                <Separator />

                <TaskLinksSection task={task} />

                <Separator />

                <TaskSubtasksSection task={task} />

                <TaskChecklistSection
                  task={task}
                  newChecklistTitle={newChecklistTitle}
                  newItemTexts={newItemTexts}
                  onNewChecklistTitleChange={setNewChecklistTitle}
                  onNewItemTextChange={(checklistId, value) =>
                    setNewItemTexts((prev) => ({ ...prev, [checklistId]: value }))
                  }
                  onAddChecklist={handleAddChecklist}
                  onAddItem={handleAddItem}
                  onToggleItem={handleToggleItem}
                />
              </div>
            </ScrollArea>

            <TaskChatPlaceholder />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
