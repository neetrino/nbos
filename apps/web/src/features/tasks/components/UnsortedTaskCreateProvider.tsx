'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { dispatchTaskCreated } from '@/features/tasks/task-created-sync';
import type { Task } from '@/lib/api/tasks';

interface UnsortedTaskCreateContextValue {
  openUnsortedTaskCreate: () => void;
}

const UnsortedTaskCreateCtx = createContext<UnsortedTaskCreateContextValue | null>(null);

export function useUnsortedTaskCreate(): UnsortedTaskCreateContextValue {
  const ctx = useContext(UnsortedTaskCreateCtx);
  if (!ctx) {
    throw new Error('useUnsortedTaskCreate must be used within UnsortedTaskCreateProvider');
  }
  return ctx;
}

export function UnsortedTaskCreateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { creatorId, creatorReady } = useTaskCreatorId();
  const queryClient = useQueryClient();

  const openUnsortedTaskCreate = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCreated = useCallback(
    (task: Task) => {
      dispatchTaskCreated(task);
      void queryClient.invalidateQueries({ queryKey: ['work-space'] });
    },
    [queryClient],
  );

  const value = useMemo(() => ({ openUnsortedTaskCreate }), [openUnsortedTaskCreate]);

  return (
    <UnsortedTaskCreateCtx.Provider value={value}>
      {children}
      <QuickCreateTaskDialog
        open={open}
        onOpenChange={setOpen}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        onCreated={handleCreated}
      />
    </UnsortedTaskCreateCtx.Provider>
  );
}
