'use client';

import type { DragEvent } from 'react';
import type { Task } from '@/lib/api/tasks';
import { TaskMiniCard } from '@/features/tasks/task-board';

export function WorkspaceScrumTaskRow({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (task: Task) => void;
}) {
  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/task-id', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div draggable onDragStart={onDragStart} className="cursor-grab active:cursor-grabbing">
      <TaskMiniCard task={task} onClick={onOpen} onAction={() => undefined} />
    </div>
  );
}
