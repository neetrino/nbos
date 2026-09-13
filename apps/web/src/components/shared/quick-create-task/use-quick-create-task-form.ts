'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from '@/i18n/localize-api-error';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { tasksApi, type Task } from '@/lib/api/tasks';
import type { MeResponse } from '@/lib/permissions/types';
import {
  applyLateIdentityArrival,
  canSubmitQuickCreateTask,
  displayNameFromMe,
  isOpenRisingEdge,
  isQuickCreateCreatorBlocked,
} from './quick-create-task-draft';
import { persistQuickCreateTaskExtras } from './persist-quick-create-task-extras';
import { pickedWorkspaceId, useQuickCreateTaskExtras } from './use-quick-create-task-extras';
import {
  resolveQuickCreateTaskLinks,
  resolveQuickCreateWorkspaceId,
} from './resolve-quick-create-task-links';

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
  /** Dimmed backdrop when opened inside a parent sheet/dialog (e.g. Deal card). */
  forceNestedBackdrop?: boolean;
  onSubmitStart?: () => void;
  onSubmitSettled?: (result: 'success' | 'failure') => void;
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
  onSubmitStart,
  onSubmitSettled,
  me,
}: QuickCreateTaskDialogProps & { me: MeResponse | null | undefined }) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const [assigneeAvatar, setAssigneeAvatar] = useState<string | undefined>();
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const extras = useQuickCreateTaskExtras();
  const { resetExtras } = extras;
  const [saving, setSaving] = useState(false);
  const wasOpenRef = useRef(false);
  const assigneeTouchedRef = useRef(false);

  const applyDefaults = useCallback(() => {
    assigneeTouchedRef.current = false;
    setTitle('');
    setDescription('');
    setIsHighPriority(false);
    setDueDate(defaultDueDate ?? '');
    resetExtras();
    if (creatorId && me) {
      setAssigneeId(creatorId);
      setAssigneeLabel(displayNameFromMe(me));
      setAssigneeAvatar(me.avatar?.trim() || undefined);
      return;
    }
    setAssigneeId('');
    setAssigneeLabel('');
    setAssigneeAvatar(undefined);
  }, [creatorId, defaultDueDate, me, resetExtras]);

  useEffect(() => {
    if (isOpenRisingEdge(wasOpenRef.current, open)) {
      applyDefaults();
    }
    wasOpenRef.current = open;
  }, [open, applyDefaults]);

  useEffect(() => {
    if (!open || !me) {
      return;
    }
    const decision = applyLateIdentityArrival(
      {
        title: '',
        description: '',
        assigneeId: '',
        assigneeTouched: assigneeTouchedRef.current,
      },
      true,
      true,
      creatorId,
      me,
    );
    if (decision.resetDraft || !decision.assigneeId) {
      return;
    }
    setAssigneeId(decision.assigneeId);
    setAssigneeLabel(displayNameFromMe(me));
    setAssigneeAvatar(me.avatar?.trim() || undefined);
  }, [open, creatorId, me]);

  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 20, search: query || undefined });
    return data.items.map((employee: Employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`.trim(),
      subtitle: employee.position ?? employee.email ?? undefined,
      avatar: employee.avatar?.trim() || undefined,
    }));
  }, []);

  const selectAssignee = useCallback((id: string, label: string, avatar?: string) => {
    assigneeTouchedRef.current = true;
    setAssigneeId(id);
    setAssigneeLabel(label);
    setAssigneeAvatar(avatar);
  }, []);

  const handleCreate = async () => {
    if (!canSubmitQuickCreateTask(title, creatorId)) {
      return;
    }
    onSubmitStart?.();
    setSaving(true);
    try {
      const task = await tasksApi.create({
        title: title.trim(),
        creatorId,
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
        priority: isHighPriority ? 'HIGH' : 'NORMAL',
        dueDate: dueDate || undefined,
        workspaceId: resolveQuickCreateWorkspaceId(
          defaultWorkspaceId,
          pickedWorkspaceId(extras.pickedLinks),
        ),
        planningStatus: defaultPlanningStatus,
        links: resolveQuickCreateTaskLinks(defaultLinks, defaultLink, extras.pickedLinks),
      });
      try {
        await persistQuickCreateTaskExtras(task.id, {
          checklists: extras.checklists,
          files: extras.stagedFiles,
        });
      } catch {
        toast.error(t('task.extrasError'));
      }
      onCreated?.(task);
      applyDefaults();
      onOpenChange(false);
      onSubmitSettled?.('success');
    } catch (caught: unknown) {
      onSubmitSettled?.('failure');
      toast.error(
        localizeCaughtApiError(
          caught,
          firstReleaseFormErrorCopy(
            tCommon('permissionDenied'),
            t('task.createError'),
            t('errors.validation'),
            t('task.createError'),
            t('errors.network'),
          ),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

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
    canCreate: canSubmitQuickCreateTask(title, creatorId),
    creatorBlocked: isQuickCreateCreatorBlocked(creatorReady, creatorId),
    stagedFiles: extras.stagedFiles,
    checklists: extras.checklists,
    pickedLinks: extras.pickedLinks,
    addFiles: extras.addFiles,
    removeFile: extras.removeFile,
    setChecklists: extras.setChecklists,
    openChecklists: extras.openChecklists,
    selectContext: extras.selectContext,
    unlink: extras.unlink,
  };
}
