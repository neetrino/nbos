'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { QuickCreateTaskDialog } from '@/components/shared/quick-create-task/QuickCreateTaskDialog';
import { AccessDeniedScreen, LoadingState } from '@/components/shared';
import { QuickActionShell } from './quick-action-shell';
import { useQuickTaskPage } from './use-quick-task-page';

const LazyTasksSurface = dynamic(
  () => import('@/features/tasks/components/TasksSurface').then((module) => module.TasksSurface),
  { ssr: false, loading: () => <LoadingState /> },
);

export function QuickTaskPage() {
  const page = useQuickTaskPage();

  if (!page.surfaceAllowed && !page.createOpen) {
    return <AccessDeniedScreen showDashboardLink={page.canViewDashboards} />;
  }

  return (
    <QuickActionShell
      form={
        <QuickCreateTaskDialog
          open={page.createOpen}
          onOpenChange={page.setCreateOpen}
          creatorId={page.creatorId ?? ''}
          creatorReady={page.creatorReady}
          onCreated={page.handleCreated}
          onSubmitStart={page.markSubmitStart}
          onSubmitSettled={page.markSubmitSettled}
        />
      }
      showBackground={!page.createOpen}
      backgroundPending={!page.backgroundEnabled}
      background={
        page.backgroundEnabled ? (
          <Suspense fallback={<LoadingState />}>
            {page.surfaceAllowed ? (
              <LazyTasksSurface
                hostedCreateDialog={false}
                onRequestCreate={() => page.setCreateOpen(true)}
                onListSettled={page.markBackgroundReady}
              />
            ) : (
              <AccessDeniedScreen showDashboardLink={page.canViewDashboards} />
            )}
          </Suspense>
        ) : null
      }
    />
  );
}
