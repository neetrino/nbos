'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import { dispatchTaskCreated } from '@/features/tasks/task-created-sync';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import type { Task } from '@/lib/api/tasks';
import { usePermission } from '@/lib/permissions';
import { canUseQuickTaskSurface } from './quick-action-access';
import {
  markQuickAction,
  QUICK_ACTION_LAUNCH_MARK,
  QUICK_TASK_BACKGROUND_READY_MARK,
  QUICK_TASK_FORM_VISIBLE_MARK,
  QUICK_TASK_IDENTITY_READY_MARK,
  QUICK_TASK_SUBMIT_FAILURE_MARK,
  QUICK_TASK_SUBMIT_START_MARK,
  QUICK_TASK_SUBMIT_SUCCESS_MARK,
  QUICK_TASK_TITLE_INTERACTIVE_MARK,
} from './quick-action-marks';

function useQuickTaskLaunchMarks(creatorReady: boolean): void {
  useEffect(() => {
    markQuickAction(QUICK_ACTION_LAUNCH_MARK);
    markQuickAction(QUICK_TASK_FORM_VISIBLE_MARK);
    markQuickAction(QUICK_TASK_TITLE_INTERACTIVE_MARK);
  }, []);

  useEffect(() => {
    if (creatorReady) {
      markQuickAction(QUICK_TASK_IDENTITY_READY_MARK);
    }
  }, [creatorReady]);
}

export function useQuickTaskPage() {
  const t = useTranslations('quick');
  const router = useRouter();
  const pathname = usePathname();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const { can, isLoading, meLoadError } = usePermission();
  const [createOpen, setCreateOpen] = useState(true);
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const surfaceAllowed = canUseQuickTaskSurface(isLoading, meLoadError, can('VIEW', 'TASKS'));
  useQuickTaskLaunchMarks(creatorReady);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setBackgroundEnabled(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const markBackgroundReady = useCallback(() => {
    markQuickAction(QUICK_TASK_BACKGROUND_READY_MARK);
  }, []);

  const handleCreated = (task: Task) => {
    dispatchTaskCreated(task);
    toast.success(t('task.created'), {
      action: {
        label: t('task.open'),
        onClick: () => {
          const params = new URLSearchParams(window.location.search);
          params.set(TASK_OPEN_QUERY, task.id);
          router.replace(`${pathname}?${params.toString()}`);
        },
      },
    });
  };

  return {
    createOpen,
    setCreateOpen,
    backgroundEnabled,
    surfaceAllowed,
    creatorId,
    creatorReady,
    canViewDashboards: can('VIEW', 'DASHBOARDS'),
    handleCreated,
    markBackgroundReady,
    markSubmitStart: () => markQuickAction(QUICK_TASK_SUBMIT_START_MARK),
    markSubmitSettled: (result: 'success' | 'failure') =>
      markQuickAction(
        result === 'success' ? QUICK_TASK_SUBMIT_SUCCESS_MARK : QUICK_TASK_SUBMIT_FAILURE_MARK,
      ),
  };
}
