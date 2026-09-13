'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { TasksSurface } from '@/features/tasks/components/TasksSurface';

export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TasksSurface />
    </Suspense>
  );
}
