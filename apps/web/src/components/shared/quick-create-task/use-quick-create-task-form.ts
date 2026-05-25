'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { tasksApi, type Task } from '@/lib/api/tasks';
import type { MeResponse } from '@/lib/permissions/types';

export interface QuickCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorReady?: boolean;
  defaultLink?: { entityType: string; entityId: string };
  defaultLinks?: Array<{ entityType: string; entityId: string }>;
  defaultDueDate?: string | null;
  defaultWorkspaceId?: string;
  defaultPlanningStatus?: string;
  onCreated?: (task: Task) => void;
  onOpenFull?: () => void;
}

function displayNameFromMe(me: MeResponse): string {
  const full = `${me.firstName} ${me.lastName}`.trim();
  return full || me.email;
}

export function useQuickCreateTaskForm({
  open,
  onOpenChange,
  creatorId,
  creatorReady = true,
  defaultLink,
  defaultLinks,
  defaultDueDate,
  defaultWorkspaceId,
  defaultPlanningStatus,
  onCreated,
  me,
}: QuickCreateTaskDialogProps & { me: MeResponse | null | undefined }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const [assigneeAvatar, setAssigneeAvatar] = useState<string | undefined>();
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const applyDefaults = useCallback(() => {
    setTitle('');
    setDescription('');
    setIsHighPriority(false);
    setDueDate(defaultDueDate ?? '');
    if (creatorId && me) {
      setAssigneeId(creatorId);
      setAssigneeLabel(displayNameFromMe(me));
      setAssigneeAvatar(me.avatar?.trim() || undefined);
      return;
    }
    setAssigneeId('');
    setAssigneeLabel('');
    setAssigneeAvatar(undefined);
  }, [creatorId, defaultDueDate, me]);

  useEffect(() => {
    if (open) applyDefaults();
  }, [open, applyDefaults]);

  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee: Employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`.trim(),
      subtitle: employee.position ?? employee.email,
      avatar: employee.avatar?.trim() || undefined,
    }));
  }, []);

  const selectAssignee = useCallback((id: string, label: string, avatar?: string) => {
    setAssigneeId(id);
    setAssigneeLabel(label);
    setAssigneeAvatar(avatar);
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !creatorId) return;
    setSaving(true);
    try {
      const task = await tasksApi.create({
        title: title.trim(),
        creatorId,
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
        priority: isHighPriority ? 'HIGH' : 'NORMAL',
        dueDate: dueDate || undefined,
        workspaceId: defaultWorkspaceId,
        planningStatus: defaultPlanningStatus,
        links: defaultLinks ?? (defaultLink ? [defaultLink] : undefined),
      });
      onCreated?.(task);
      applyDefaults();
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(getApiErrorMessage(caught, 'Could not create task. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const canCreate = Boolean(title.trim()) && !(creatorReady && !creatorId);

  return {
    title,
    setTitle,
    description,
    setDescription,
    assigneeId,
    assigneeLabel,
    assigneeAvatar,
    selectAssignee,
    searchEmployees,
    isHighPriority,
    setIsHighPriority,
    dueDate,
    setDueDate,
    saving,
    handleCreate,
    canCreate,
    creatorBlocked: creatorReady && !creatorId,
  };
}
