'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { tasksApi, type Task } from '@/lib/api/tasks';
import {
  buildTaskGeneralPatch,
  createTaskGeneralDraft,
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

export function useTaskSheetState({ taskId, open, onUpdate, onDelete }: UseTaskSheetStateParams) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<TaskGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<TaskGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [completionBlockers, setCompletionBlockers] = useState<TaskCompletionBlocker[]>([]);
  const [messagesByTask, setMessagesByTask] = useState<Record<string, TaskLocalMessage[]>>({});

  const hydrateTask = useCallback((nextTask: Task) => {
    setTask(nextTask);
    const nextDraft = createTaskGeneralDraft(nextTask);
    setGeneralDraft(nextDraft);
    setGeneralSnap(nextDraft);
  }, []);

  useEffect(() => {
    if (!taskId || !open) return;
    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      try {
        const nextTask = await tasksApi.getById(taskId!);
        if (!cancelled) {
          hydrateTask(nextTask);
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
  }, [hydrateTask, open, taskId]);

  const refetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const nextTask = await tasksApi.getById(taskId);
      hydrateTask(nextTask);
      setGeneralError(null);
    } catch (caught) {
      setGeneralError(getApiErrorMessage(caught, 'Task could not be refreshed.'));
    }
  }, [hydrateTask, taskId]);

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

  const handleGeneralSave = useCallback(async () => {
    if (!task || !generalDraft || !generalSnap) return false;
    const patch = buildTaskGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return true;

    setSaving(true);
    setGeneralError(null);
    try {
      const statusTarget = typeof patch.status === 'string' ? patch.status : undefined;
      const fieldPatch = { ...patch };
      delete fieldPatch.status;

      let updated: Task = task;
      if (Object.keys(fieldPatch).length > 0) {
        updated = await tasksApi.update(task.id, fieldPatch);
      }

      if (statusTarget === 'COMPLETED' && generalSnap.status !== 'COMPLETED') {
        updated = await tasksApi.complete(task.id);
      } else if (statusTarget && statusTarget !== generalSnap.status) {
        updated = await tasksApi.update(task.id, { status: statusTarget });
      }

      hydrateTask(updated);
      setCompletionBlockers([]);
      onUpdate?.(updated);
      return true;
    } catch (caught) {
      const message = getApiErrorMessage(caught, 'Task could not be updated.');
      setGeneralError(message);
      toast.error(message);
      if (patch.status === 'COMPLETED') {
        setCompletionBlockers(parseTaskCompletionBlockers(caught));
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [generalDraft, generalSnap, hydrateTask, onUpdate, task]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const handleAction = useCallback(
    async (action: 'start' | 'complete' | 'reopen' | 'hold') => {
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
        hydrateTask(updated);
        onUpdate?.(updated);
        setGeneralError(null);
        setCompletionBlockers([]);
      } catch (caught) {
        const message = getApiErrorMessage(caught, 'Task action could not be completed.');
        setGeneralError(message);
        toast.error(message);
        if (action === 'complete') setCompletionBlockers(parseTaskCompletionBlockers(caught));
      } finally {
        setSaving(false);
      }
    },
    [hydrateTask, onUpdate, task],
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

  const handleRemoveLink = useCallback(
    async (linkId: string) => {
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
    },
    [setLocalTask, task],
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
    saving,
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
    handleGeneralSave,
    handleGeneralCancel,
    handleAction,
    handleAddChecklist,
    handleDeleteChecklist,
    handleAddItem,
    handleToggleItem,
    handleDeleteItem,
    handleRemoveLink,
    handleDeleteTask,
    handleSendMessage,
    searchEmployees,
    refetchTask,
  };
}
