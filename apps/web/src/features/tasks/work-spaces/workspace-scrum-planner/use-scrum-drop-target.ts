'use client';

import { useCallback, type DragEvent } from 'react';

export function useScrumDropTarget(onDropTask: (taskId: string) => void) {
  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/task-id');
      if (taskId) onDropTask(taskId);
    },
    [onDropTask],
  );

  return { onDragOver, onDrop };
}
