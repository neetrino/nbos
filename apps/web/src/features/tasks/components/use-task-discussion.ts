'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { tasksApi, type TaskDiscussionEntry } from '@/lib/api/tasks';
import type { TaskLocalMessage } from './TaskSheetChatPanel';

export function useTaskDiscussion(taskId: string | null, open: boolean) {
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TaskLocalMessage[]>([]);
  const activeId = open ? taskId : null;

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void tasksApi
      .listDiscussion(activeId)
      .then((page) => {
        if (cancelled) return;
        setMessages(page.items.map(toLocalMessage));
        setLoadedForId(activeId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadedForId(activeId);
        setMessages([]);
        toast.error(getApiErrorMessage(error, 'Could not load task discussion.'));
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const send = useCallback(
    async (body: string) => {
      if (!activeId) return;
      try {
        const entry = await tasksApi.addDiscussion(activeId, body);
        setMessages((current) => [...current, toLocalMessage(entry)]);
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, 'Could not post the note.'));
      }
    },
    [activeId],
  );

  return {
    messages: loadedForId === activeId ? messages : [],
    send,
  };
}

function toLocalMessage(entry: TaskDiscussionEntry): TaskLocalMessage {
  return {
    id: entry.id,
    body: entry.body,
    createdAt: entry.createdAt,
    authorLabel: entry.authorDisplayName,
  };
}
