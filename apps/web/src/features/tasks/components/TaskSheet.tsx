'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/shared';
import {
  Play,
  CheckCircle2,
  RotateCcw,
  Pause,
  Plus,
  Link as LinkIcon,
  Calendar,
  User,
  Users,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getTaskStatus, getTaskPriority } from '../constants/tasks';

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

  useEffect(() => {
    if (!taskId || !open) return;
    let cancelled = false;

    async function loadTask() {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const nextTask = await tasksApi.getById(taskId!);
        if (!cancelled) setTask(nextTask);
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
      onUpdate?.(updated);
    } catch {}
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-4xl flex-col p-0 sm:max-w-4xl">
        <SheetHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{loading ? 'Loading...' : task?.title}</SheetTitle>
            {task && (
              <div className="flex items-center gap-2">
                {task.status === 'NEW' && (
                  <Button size="sm" variant="outline" onClick={() => handleAction('start')}>
                    <Play size={14} /> Start
                  </Button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleAction('defer')}>
                      <Pause size={14} /> Defer
                    </Button>
                    <Button size="sm" onClick={() => handleAction('complete')}>
                      <CheckCircle2 size={14} /> Complete
                    </Button>
                  </>
                )}
                {(task.status === 'DONE' ||
                  task.status === 'DEFERRED' ||
                  task.status === 'CANCELLED') && (
                  <Button size="sm" variant="outline" onClick={() => handleAction('reopen')}>
                    <RotateCcw size={14} /> Reopen
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        {task && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Task Info */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Status & Priority */}
                <div className="flex flex-wrap gap-3">
                  {status && <StatusBadge label={status.label} variant={status.variant} />}
                  {priority && <StatusBadge label={priority.label} variant={priority.variant} />}
                  <Badge variant="outline">{task.code}</Badge>
                </div>

                {/* Description */}
                {task.description && (
                  <div>
                    <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      Description
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                <Separator />

                {/* People */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                      <User size={12} /> Creator
                    </h4>
                    <p className="text-sm">
                      {task.creator.firstName} {task.creator.lastName}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                      <User size={12} /> Assignee
                    </h4>
                    <p className="text-sm">
                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                    </p>
                  </div>
                  {task.coAssignees.length > 0 && (
                    <div>
                      <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                        <Users size={12} /> Co-Assignees
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {task.coAssignees.length} people
                      </p>
                    </div>
                  )}
                  {task.observers.length > 0 && (
                    <div>
                      <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                        <Eye size={12} /> Observers
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {task.observers.length} people
                      </p>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                      <Calendar size={12} /> Start Date
                    </h4>
                    <p className="text-sm">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium uppercase">
                      <Calendar size={12} /> Due Date
                    </h4>
                    <p className="text-sm">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Links */}
                <div>
                  <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium uppercase">
                    <LinkIcon size={12} /> Linked Entities
                  </h4>
                  {task.links.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No linked entities</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {task.links.map((link) => (
                        <Badge key={link.id} variant="secondary">
                          {link.entityType}: {link.entityId.slice(0, 8)}...
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Subtasks */}
                {task.subtasks.length > 0 && (
                  <div>
                    <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                      Subtasks ({task.subtasks.filter((s) => s.status === 'DONE').length}/
                      {task.subtasks.length})
                    </h4>
                    <div className="space-y-1">
                      {task.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={sub.status === 'DONE'} disabled />
                          <span
                            className={
                              sub.status === 'DONE' ? 'text-muted-foreground line-through' : ''
                            }
                          >
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklists */}
                <div>
                  <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                    Checklists
                  </h4>
                  {task.checklists.map((cl) => {
                    const done = cl.items.filter((i) => i.checked).length;
                    return (
                      <div key={cl.id} className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {cl.title} ({done}/{cl.items.length})
                          </p>
                        </div>
                        <div className="space-y-1">
                          {cl.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={item.checked}
                                onCheckedChange={() => handleToggleItem(cl.id, item.id)}
                              />
                              <span
                                className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : ''}`}
                              >
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={newItemTexts[cl.id] ?? ''}
                            onChange={(e) =>
                              setNewItemTexts((prev) => ({ ...prev, [cl.id]: e.target.value }))
                            }
                            placeholder="Add item..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cl.id)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleAddItem(cl.id)}>
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      placeholder="New checklist title..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddChecklist}>
                      <Plus size={14} /> Add Checklist
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right: Chat placeholder */}
            <div className="border-border bg-muted/30 flex w-80 flex-col border-l">
              <div className="border-border flex items-center gap-2 border-b px-4 py-3">
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Task Chat</span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground text-center text-sm">
                  Chat will be integrated with the messenger system
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
