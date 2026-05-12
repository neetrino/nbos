'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Calendar,
  CheckSquare,
  ClipboardList,
  Flag,
  FolderKanban,
  Hash,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { InlineField } from '@/components/shared/InlineField';
import { SearchField } from '@/components/shared/SearchField';
import { StatusBadge } from '@/components/shared';
import { getApiErrorMessage } from '@/lib/api-errors';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getTaskPriority, getTaskStatus, TASK_PRIORITIES } from '../constants/tasks';
import { resolveTaskOrderContext } from '../utils/task-order-context';
import {
  buildTaskCompletionBlockers,
  parseTaskCompletionBlockers,
  type TaskCompletionBlocker,
} from '../utils/task-completion-readiness';
import { TaskActionButtons } from './TaskActionButtons';
import { TaskChatPlaceholder, type TaskLocalMessage } from './TaskChatPlaceholder';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCompletionRulesPanel } from './TaskCompletionRulesPanel';
import { TaskLinksSection, TaskPeopleSection, TaskDatesSection } from './TaskDetailsSections';
import { TaskSubtasksSection } from './TaskSubtasksSection';

interface TaskSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskSheet({ taskId, open, onOpenChange, onUpdate }: TaskSheetProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [completionBlockers, setCompletionBlockers] = useState<TaskCompletionBlocker[]>([]);
  const [messagesByTask, setMessagesByTask] = useState<Record<string, TaskLocalMessage[]>>({});

  useEffect(() => {
    if (!taskId || !open) return;
    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      try {
        const nextTask = await tasksApi.getById(taskId!);
        if (!cancelled) {
          setTask(nextTask);
          setActionError(null);
          setCompletionBlockers([]);
          setNewChecklistTitle('');
          setNewItemTexts({});
        }
      } catch (caught) {
        if (!cancelled) {
          setActionError(getApiErrorMessage(caught, 'Task could not be loaded.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTask();
    return () => {
      cancelled = true;
    };
  }, [taskId, open]);

  const publishTask = useCallback(
    (nextTask: Task) => {
      setTask(nextTask);
      onUpdate?.(nextTask);
    },
    [onUpdate],
  );

  const patchTask = useCallback(
    async (data: Record<string, unknown>, successMessage?: string) => {
      if (!task) return;
      setSaving(true);
      try {
        const updated = await tasksApi.update(task.id, data);
        publishTask(updated);
        setActionError(null);
        setCompletionBlockers([]);
        if (successMessage) toast.success(successMessage);
      } catch (caught) {
        const message = getApiErrorMessage(caught, 'Task could not be updated.');
        setActionError(message);
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [publishTask, task],
  );

  const setLocalTask = useCallback(
    (recipe: (current: Task) => Task) => {
      setTask((current) => {
        if (!current) return current;
        const nextTask = recipe(current);
        onUpdate?.(nextTask);
        return nextTask;
      });
    },
    [onUpdate],
  );

  const handleAction = async (action: 'start' | 'complete' | 'reopen' | 'hold') => {
    if (!task) return;
    setSaving(true);
    try {
      const updated =
        action === 'start'
          ? await tasksApi.start(task.id)
          : action === 'complete'
            ? await tasksApi.complete(task.id)
            : action === 'reopen'
              ? await tasksApi.reopen(task.id)
              : await tasksApi.setOnHold(task.id);
      publishTask(updated);
      setActionError(null);
      setCompletionBlockers([]);
    } catch (caught) {
      const message = getApiErrorMessage(caught, 'Task action could not be completed.');
      setActionError(message);
      toast.error(message);
      if (action === 'complete') setCompletionBlockers(parseTaskCompletionBlockers(caught));
    } finally {
      setSaving(false);
    }
  };

  const handleAddChecklist = async () => {
    if (!task || !newChecklistTitle.trim()) return;
    try {
      const checklist = await tasksApi.createChecklist(task.id, newChecklistTitle.trim());
      setLocalTask((current) => ({ ...current, checklists: [...current.checklists, checklist] }));
      setNewChecklistTitle('');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist could not be created.'));
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await tasksApi.deleteChecklist(checklistId);
      setLocalTask((current) => ({
        ...current,
        checklists: current.checklists.filter((checklist) => checklist.id !== checklistId),
      }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist could not be deleted.'));
    }
  };

  const handleAddItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      const item = await tasksApi.addChecklistItem(checklistId, text);
      setLocalTask((current) => ({
        ...current,
        checklists: current.checklists.map((checklist) =>
          checklist.id === checklistId
            ? { ...checklist, items: [...checklist.items, item] }
            : checklist,
        ),
      }));
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist item could not be added.'));
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    try {
      const updated = await tasksApi.toggleChecklistItem(itemId);
      setLocalTask((current) => ({
        ...current,
        checklists: current.checklists.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: checklist.items.map((item) => (item.id === itemId ? updated : item)),
              }
            : checklist,
        ),
      }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist item could not be updated.'));
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      await tasksApi.deleteChecklistItem(itemId);
      setLocalTask((current) => ({
        ...current,
        checklists: current.checklists.map((checklist) =>
          checklist.id === checklistId
            ? { ...checklist, items: checklist.items.filter((item) => item.id !== itemId) }
            : checklist,
        ),
      }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist item could not be deleted.'));
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    if (!task) return;
    try {
      await tasksApi.removeLink(task.id, linkId);
      setLocalTask((current) => ({
        ...current,
        links: current.links.filter((link) => link.id !== linkId),
      }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Link could not be removed.'));
    }
  };

  const handleSendMessage = (body: string) => {
    if (!task) return;
    setMessagesByTask((prev) => ({
      ...prev,
      [task.id]: [
        ...(prev[task.id] ?? []),
        { id: `${task.id}-${Date.now()}`, body, createdAt: new Date().toISOString() },
      ],
    }));
  };

  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee) => ({
      value: employee.id,
      label: employeeName(employee),
      subtitle: employee.position ?? employee.email,
    }));
  }, []);

  if (!task && !loading && !actionError) return null;

  const status = task ? getTaskStatus(task.status) : null;
  const priority = task ? getTaskPriority(task.priority) : null;
  const blockers = task ? buildTaskCompletionBlockers(task) : [];
  const readyForCompletion = task ? blockers.length === 0 : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-6xl flex-col p-0 sm:max-w-6xl">
        <SheetHeader className="border-border border-b px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {status && <StatusBadge label={status.label} variant={status.variant} />}
                {priority && <StatusBadge label={priority.label} variant={priority.variant} />}
                {task && <Badge variant="outline">{task.code}</Badge>}
                {task && (
                  <StatusBadge
                    label={readyForCompletion ? 'Ready' : 'Blocked'}
                    variant={readyForCompletion ? 'green' : 'red'}
                  />
                )}
              </div>
              <SheetTitle className="text-lg leading-tight">
                {loading ? 'Loading task...' : task?.title}
              </SheetTitle>
            </div>
            {task && <TaskActionButtons task={task} disabled={saving} onAction={handleAction} />}
          </div>
        </SheetHeader>

        {loading && !task ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : task ? (
          <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 p-5">
                {actionError && (
                  <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                    {actionError}
                  </div>
                )}

                <TaskSummaryCard task={task} />

                <section className="border-border bg-card rounded-lg border p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <InlineField
                      label="Title"
                      value={task.title}
                      icon={<ClipboardList size={13} />}
                      onSave={(value) => {
                        const nextTitle = value?.trim();
                        if (nextTitle && nextTitle !== task.title) {
                          return patchTask({ title: nextTitle });
                        }
                      }}
                    />
                    <InlineField
                      label="Priority"
                      value={task.priority}
                      displayValue={priority?.label ?? task.priority}
                      type="select"
                      icon={<Flag size={13} />}
                      options={TASK_PRIORITIES.map((item) => ({
                        value: item.value,
                        label: item.label,
                      }))}
                      onSave={(value) => {
                        if (value) return patchTask({ priority: value });
                      }}
                    />
                    <InlineField
                      label="Start Date"
                      value={formatDateInput(task.startDate)}
                      displayValue={formatDateDisplay(task.startDate)}
                      type="date"
                      icon={<Calendar size={13} />}
                      clearable
                      onSave={(value) => patchTask({ startDate: value || null })}
                    />
                    <InlineField
                      label="Due Date"
                      value={formatDateInput(task.dueDate)}
                      displayValue={formatDateDisplay(task.dueDate)}
                      type="date"
                      icon={<Calendar size={13} />}
                      clearable
                      onSave={(value) => patchTask({ dueDate: value || null })}
                    />
                    <SearchField
                      label="Assignee"
                      value={task.assignee?.id ?? null}
                      icon={<User size={13} />}
                      displayValue={
                        task.assignee ? (
                          <PersonPill>
                            {task.assignee.firstName} {task.assignee.lastName}
                          </PersonPill>
                        ) : undefined
                      }
                      placeholder="Assign employee"
                      onSearch={searchEmployees}
                      onSave={(employeeId) => patchTask({ assigneeId: employeeId })}
                      onClear={() => patchTask({ assigneeId: null })}
                    />
                    <InlineField
                      label="Description"
                      value={task.description ?? ''}
                      displayValue={
                        task.description ? (
                          <span className="whitespace-pre-wrap">{task.description}</span>
                        ) : undefined
                      }
                      type="textarea"
                      placeholder="Add description"
                      className="lg:col-span-2"
                      onSave={(value) => patchTask({ description: value?.trim() || null })}
                    />
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="border-border bg-card rounded-lg border p-4">
                    <TaskPeopleSection task={task} />
                  </section>
                  <section className="border-border bg-card rounded-lg border p-4">
                    <TaskDatesSection task={task} />
                  </section>
                </div>

                <section className="border-border bg-card rounded-lg border p-4">
                  <TaskCompletionRulesPanel task={task} serverBlockers={completionBlockers} />
                </section>

                <section className="border-border bg-card rounded-lg border p-4">
                  <TaskLinksSection task={task} onRemoveLink={handleRemoveLink} />
                </section>

                {task.subtasks.length > 0 && (
                  <section className="border-border bg-card rounded-lg border p-4">
                    <TaskSubtasksSection task={task} />
                  </section>
                )}

                <Separator />

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
                  onDeleteChecklist={handleDeleteChecklist}
                  onDeleteItem={handleDeleteItem}
                />
              </div>
            </ScrollArea>

            <TaskChatPlaceholder
              task={task}
              messages={messagesByTask[task.id] ?? []}
              onSend={handleSendMessage}
            />
          </div>
        ) : (
          <div className="text-muted-foreground p-5 text-sm">{actionError}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskSummaryCard({ task }: { task: Task }) {
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
    <section className="border-border bg-card rounded-lg border p-4">
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

function PersonPill({ children }: { children: ReactNode }) {
  return <span className="text-foreground font-medium">{children}</span>;
}

function employeeName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function formatDateInput(value: string | null): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateDisplay(value: string | null): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString();
}
