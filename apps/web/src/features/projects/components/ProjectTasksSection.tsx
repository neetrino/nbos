'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectOrder } from '@/lib/api/projects';
import { TasksTab } from '@/features/projects/components/tabs/TasksTab';

export function ProjectTasksSection({
  projectId,
  orders,
}: {
  projectId: string;
  orders: Pick<ProjectOrder, 'id' | 'code'>[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>
          Work across this project. Filter by order to see tasks for a specific commercial line
          (product, extension, or linked work space).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TasksTab projectId={projectId} orders={orders} />
      </CardContent>
    </Card>
  );
}
