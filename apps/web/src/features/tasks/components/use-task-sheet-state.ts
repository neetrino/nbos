'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { toggleTaskUrgentPriority } from '../constants/tasks';
import {
  buildTaskGeneralPatch,
  enrichTaskGeneralDraft,
  isTaskGeneralDirty,
  type TaskGeneralDraft,
} from '../task-general-form-state';
import {
  parseTaskCompletionBlockers,
  type TaskCompletionBlocker,
} from '../utils/task-completion-readiness';
import type { TaskLocalMessage } from './TaskSheetChatPanel';

interface UseTaskSheetStateParams {
  taskId: string | null;
  open: boolean;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

function taskGeneralSaveErrorMessage(err: unknown): string {
  return getApiErrorMessage(err, 'Could not save changes.');
}

export function useTaskSheetState({ taskId, open, onUpdate, onDelete }: UseTaskSheetStateParams) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<TaskGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<TaskGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [completionBlockers, setCompletionBlockers] = useState<TaskCompletionBlocker[]>([]);
  const [messagesByTask, setMessagesByTask] = useState<Record<string, TaskLocalMessage[]>>({});
  const generalDirtyRef = useRef(false);

  const applyTaskFromServer = useCallback(
    async (nextTask: Task, options?: { forceDraftReset?: boolean }) => {
      setTask(nextTask);
      if (generalDirtyRef.current && !options?.forceDraftReset) return;
      const nextDraft = await enrichTaskGeneralDraft(nextTask);
      setGeneralDraft(nextDraft);
      setGeneralSnap(nextDraft);
    },
    [],
  );

  useEffect(() => {
    if (!taskId || !open) return;
    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      try {
        const nextTask = await tasksApi.getById(taskId!);
        if (!cancelled) {
          await applyTaskFromServer(nextTask, { forceDraftReset: true });
          setGeneralError(null);
          setCompletionBlockers([]);
          setNewChecklistTitle('');
          setNewItemTexts({});
        }
      } catch (caught) {
        if (!cancelled) {
          setGeneralError(getApiErrorMessage(caught, 'Task could not be loaded.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTask();
    return () => {
      cancelled = true;
    };
  }, [applyTaskFromServer, open, taskId]);

  useLayoutEffect(() => {
    if (!task) {
      queueMicrotask(() => {
        setGeneralDraft(null);
        setGeneralSnap(null);
      });
      return;
    }
    if (generalDirtyRef.current) return;
    void applyTaskFromServer(task);
  }, [applyTaskFromServer, task?.id, task?.updatedAt]);

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

  const patchGeneralDraft = useCallback((partial: Partial<TaskGeneralDraft>) => {
    setGeneralDraft((current) => (current ? { ...current, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isTaskGeneralDirty(generalDraft, generalSnap);

  useEffect(() => {
    generalDirtyRef.current = generalDirty;
  }, [generalDirty]);

  const handleToggleTaskUrgent = useCallback(() => {
    if (!task || !generalDraft || !generalSnap) return;

    const nextPriority = toggleTaskUrgentPriority(generalDraft.priority);
    if (nextPriority === generalDraft.priority) return;

    const draftAtToggle = generalDraft;
    const snapAtToggle = generalSnap;
    const previousPriority = generalDraft.priority;
    const nextDraft = { ...generalDraft, priority: nextPriority };

    setGeneralError(null);
    setGeneralDraft(nextDraft);
    setGeneralSnap(nextDraft);
    setTask((current) => (current ? { ...current, priority: nextPriority } : current));

    void (async () => {
      try {
        const updated = await tasksApi.update(task.id, { priority: nextPriority });
        setTask(updated);
        onUpdate?.(updated);
      } catch (caught) {
        setGeneralDraft(draftAtToggle);
        setGeneralSnap(snapAtToggle);
        setTask((current) => (current ? { ...current, priority: previousPriority } : current));
        const message = getApiErrorMessage(caught, 'Priority could not be updated.');
        setGeneralError(message);
        toast.error(message);
      }
    })();
  }, [generalDraft, generalSnap, onUpdate, task]);

  const handleGeneralSave = useCallback(() => {
    if (!task || !generalDraft || !generalSnap) return false;
    setGeneralError(null);
    const patch = buildTaskGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return true;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });

    void (async () => {
      try {
        const statusTarget = typeof patch.status === 'string' ? patch.status : undefined;
        const fieldPatch = { ...patch };
        delete fieldPatch.status;

        let updated: Task = task;
        if (Object.keys(fieldPatch).length > 0) {
          updated = await tasksApi.update(task.id, fieldPatch);
        }

        if (statusTarget === 'COMPLETED' && snapAtSave.status !== 'COMPLETED') {
          updated = await tasksApi.complete(task.id);
        } else if (statusTarget === 'REVIEW' && snapAtSave.status !== 'REVIEW') {
          updated = await tasksApi.submitForReview(task.id);
        } else if (statusTarget && statusTarget !== snapAtSave.status) {
          updated = await tasksApi.update(task.id, { status: statusTarget });
        }

        setTask(updated);
        onUpdate?.(updated);
        setCompletionBlockers([]);
        const syncedDraft = await enrichTaskGeneralDraft(updated);
        setGeneralDraft(syncedDraft);
        setGeneralSnap(syncedDraft);
      } catch (caught) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        const message = taskGeneralSaveErrorMessage(caught);
        setGeneralError(message);
        toast.error(message);
        if (patch.status === 'COMPLETED') {
          setCompletionBlockers(parseTaskCompletionBlockers(caught));
        }
      }
    })();

    return true;
  }, [generalDraft, generalSnap, onUpdate, task]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const handleAction = useCallback(
    async (
      action: 'start' | 'complete' | 'reopen' | 'hold' | 'approveReview' | 'requestReviewChanges',
    ) => {
      if (!task) return;
      setWorkflowSaving(true);
      try {
        const updated =
          action === 'start'
            ? await tasksApi.start(task.id)
            : action === 'complete'
              ? await tasksApi.complete(task.id)
              : action === 'reopen'
                ? await tasksApi.reopen(task.id)
                : action === 'approveReview'
                  ? await tasksApi.approveReview(task.id)
                  : action === 'requestReviewChanges'
                    ? await tasksApi.requestReviewChanges(task.id)
                    : await tasksApi.setOnHold(task.id);
        await applyTaskFromServer(updated, { forceDraftReset: true });
        onUpdate?.(updated);
        setGeneralError(null);
        setCompletionBlockers([]);
      } catch (caught) {
        const message = getApiErrorMessage(caught, 'Task action could not be completed.');
        setGeneralError(message);
        toast.error(message);
        if (action === 'complete') setCompletionBlockers(parseTaskCompletionBlockers(caught));
      } finally {
        setWorkflowSaving(false);
      }
    },
    [applyTaskFromServer, onUpdate, task],
  );

  const handleAddChecklist = useCallback(async () => {
    if (!task || !newChecklistTitle.trim()) return;
    try {
      const checklist = await tasksApi.createChecklist(task.id, newChecklistTitle.trim());
      setLocalTask((current) => ({ ...current, checklists: [...current.checklists, checklist] }));
      setNewChecklistTitle('');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Checklist could not be created.'));
    }
  }, [newChecklistTitle, setLocalTask, task]);

  const handleDeleteChecklist = useCallback(
    async (checklistId: string) => {
      try {
        await tasksApi.deleteChecklist(checklistId);
        setLocalTask((current) => ({
          ...current,
          checklists: current.checklists.filter((checklist) => checklist.id !== checklistId),
        }));
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Checklist could not be deleted.'));
      }
    },
    [setLocalTask],
  );

  const handleAddItem = useCallback(
    async (checklistId: string) => {
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
    },
    [newItemTexts, setLocalTask],
  );

  const handleToggleItem = useCallback(
    async (checklistId: string, itemId: string) => {
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
    },
    [setLocalTask],
  );

  const handleDeleteItem = useCallback(
    async (checklistId: string, itemId: string) => {
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
    },
    [setLocalTask],
  );

  const handleDeleteTask = useCallback(async () => {
    if (!task) return false;
    try {
      await tasksApi.delete(task.id);
      onDelete?.(task.id);
      return true;
    } catch (caught) {
      const message = getApiErrorMessage(caught, 'Task could not be deleted.');
      setGeneralError(message);
      toast.error(message);
      return false;
    }
  }, [onDelete, task]);

  const handleSendMessage = useCallback(
    (body: string) => {
      if (!task) return;
      setMessagesByTask((prev) => ({
        ...prev,
        [task.id]: [
          ...(prev[task.id] ?? []),
          {
            id: `${task.id}-${Date.now()}`,
            body,
            createdAt: new Date().toISOString(),
            authorLabel: 'You',
          },
        ],
      }));
    },
    [task],
  );

  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee: Employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`.trim(),
      subtitle: employee.position ?? employee.email,
    }));
  }, []);

  return {
    task,
    loading,
    workflowSaving,
    generalDraft,
    generalError,
    generalDirty,
    completionBlockers,
    newChecklistTitle,
    newItemTexts,
    taskMessages: task ? (messagesByTask[task.id] ?? []) : [],
    setNewChecklistTitle,
    setNewItemTexts,
    patchGeneralDraft,
    handleToggleTaskUrgent,
    handleGeneralSave,
    handleGeneralCancel,
    handleAction,
    handleAddChecklist,
    handleDeleteChecklist,
    handleAddItem,
    handleToggleItem,
    handleDeleteItem,
    handleDeleteTask,
    handleSendMessage,
    searchEmployees,
  };
}
