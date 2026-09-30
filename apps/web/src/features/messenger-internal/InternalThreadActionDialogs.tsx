'use client';

import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { Task } from '@/lib/api/tasks';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { InternalCreateTaskFromMessages } from './InternalCreateTaskFromMessages';
import { InternalDeleteMessagesDialog } from './InternalDeleteMessagesDialog';
import { InternalForwardDialog } from './InternalForwardDialog';
import type { PendingForwardDraft } from './pending-forward-draft';
import type { useInternalThreadActions } from './use-internal-thread-actions';

type ThreadActions = ReturnType<typeof useInternalThreadActions>;

export function InternalThreadActionDialogs({
  conversation,
  actions,
  creatorId,
  creatorReady,
  onBeginForward,
}: {
  conversation: MessengerCoreConversationRow;
  actions: ThreadActions;
  creatorId: string | null;
  creatorReady: boolean;
  onOpenTarget?: (conversationId: string, seed?: MessengerCoreConversationRow) => void;
  onBeginForward?: (target: MessengerCoreConversationRow, draft: PendingForwardDraft) => void;
}) {
  return (
    <>
      <InternalForwardDialog
        open={actions.forwardOpen}
        currentConversationId={conversation.id}
        onClose={() => actions.setForwardOpen(false)}
        onForward={(_id, target) => {
          const preview = actions.forwardPreview;
          if (!preview || actions.forwardSourceIds.length === 0) {
            return Promise.reject(new Error('Select a message to forward'));
          }
          onBeginForward?.(target, {
            conversationId: target.id,
            sourceMessageIds: actions.forwardSourceIds,
            senderName: preview.senderName,
            content: preview.content,
          });
          actions.clearSelection();
          actions.setForwardOpen(false);
          return Promise.resolve();
        }}
      />
      <InternalDeleteMessagesDialog
        open={actions.deleteConfirmOpen}
        count={actions.deleteOwnCount}
        isSubmitting={actions.deleteSubmitting}
        errorMessage={actions.deleteError}
        onOpenChange={actions.setDeleteConfirmOpen}
        onConfirm={actions.confirmDelete}
      />
      {creatorId ? (
        <InternalCreateTaskFromMessages
          open={actions.createTaskOpen}
          creatorId={creatorId}
          creatorReady={creatorReady}
          defaultLinks={conversation.primaryLinks}
          selectedCount={actions.selectedMessages.length}
          onOpenChange={actions.setCreateTaskOpen}
          onCreated={(task) => void attachSources(task, actions)}
        />
      ) : null}
    </>
  );
}

async function attachSources(task: Task, actions: ThreadActions): Promise<void> {
  try {
    await messengerCoreApi.attachTaskSources(
      actions.selectedMessages.map((row) => row.id),
      task.id,
    );
    toast.success('Task created with source references');
    actions.clearSelection();
    actions.setCreateTaskOpen(false);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Task was created but source references failed.'));
  }
}
