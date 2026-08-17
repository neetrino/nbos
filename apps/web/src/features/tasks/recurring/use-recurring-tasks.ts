'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import type { RecurringStatusFilter } from './recurring-task-constants';

export function useRecurringTasks() {
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RecurringStatusFilter>('all');
  const [processingDue, setProcessingDue] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await recurringTasksApi.list();
      setTemplates(rows);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Recurring templates could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((row) => {
      if (status === 'active' && !row.isActive) return false;
      if (status === 'paused' && row.isActive) return false;
      if (!query) return true;
      const haystack =
        `${row.title} ${row.description ?? ''} ${row.assignee?.firstName ?? ''} ${row.assignee?.lastName ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [templates, search, status]);

  const processDue = useCallback(async () => {
    setProcessingDue(true);
    try {
      const result = await recurringTasksApi.processDue();
      await fetchTemplates();
      if (result.created === 0) {
        toast.message('No due templates right now.');
        return;
      }
      toast.success(
        result.created === 1
          ? 'Created 1 task from due templates.'
          : `Created ${result.created} tasks from due templates.`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Due templates could not be processed.'));
    } finally {
      setProcessingDue(false);
    }
  }, [fetchTemplates]);

  const upsert = useCallback((row: RecurringTaskTemplate) => {
    setTemplates((current) => {
      const without = current.filter((item) => item.id !== row.id);
      return [row, ...without];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTemplates((current) => current.filter((item) => item.id !== id));
  }, []);

  return {
    templates,
    visible,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    processingDue,
    fetchTemplates,
    processDue,
    upsert,
    remove,
  };
}
