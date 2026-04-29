'use client';

import { ExtensionBlockerPanel } from '@/features/projects/components/extensions/ExtensionReadiness';
import { ExtensionsEmptyState } from '@/features/projects/components/extensions/ExtensionsEmptyState';
import { ExtensionsTabHeader } from '@/features/projects/components/extensions/ExtensionsTabHeader';
import { ExtensionsTable } from '@/features/projects/components/extensions/ExtensionsTable';
import { useExtensionsTabState } from '@/features/projects/components/extensions/useExtensionsTabState';

interface ExtensionsTabProps {
  projectId: string;
  onCreateClick: () => void;
}

export function ExtensionsTab({ projectId, onCreateClick }: ExtensionsTabProps) {
  const state = useExtensionsTabState(projectId);

  if (state.loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading extensions...</div>
    );
  }

  return (
    <div className="space-y-4">
      <ExtensionsTabHeader
        extensions={state.extensions}
        statusFilter={state.statusFilter}
        onStatusFilterChange={state.setStatusFilter}
        onCreateClick={onCreateClick}
      />

      {state.blocker && (
        <ExtensionBlockerPanel blocker={state.blocker} onDismiss={state.clearBlocker} />
      )}

      {state.visibleExtensions.length === 0 ? (
        <ExtensionsEmptyState
          onCreateClick={onCreateClick}
          message={
            state.extensions.length > 0
              ? 'No extensions match this delivery filter.'
              : 'No extensions in this project yet.'
          }
        />
      ) : (
        <ExtensionsTable
          extensions={state.visibleExtensions}
          onStatusChange={state.handleStatusChange}
          onLifecycleAction={state.handleLifecycleAction}
        />
      )}
    </div>
  );
}
