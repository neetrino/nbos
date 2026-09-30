'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { applyMessengerSendResult } from '@/features/messenger/query/messenger-cache';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { Task } from '@/lib/api/tasks';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { InternalCreateTaskFromMessages } from './InternalCreateTaskFromMessages';
import { InternalDeleteMessagesDialog } from './InternalDeleteMessagesDialog';
import { InternalForwardDialog } from './InternalForwardDialog';
import type { useInternalThreadActions } from './use-internal-thread-actions';

type ThreadActions = ReturnType<typeof useInternalThreadActions>;

export function InternalThreadActionDialogs({
  conversation,
  actions,
  creatorId,
  creatorReady,
  onOpenTarget,
}: {
  conversation: MessengerCoreConversationRow;
  actions: ThreadActions;
  creatorId: string | null;
  creatorReady: boolean;
  onOpenTarget?: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  return (
    <>
      <InternalForwardDialog
        open={actions.forwardOpen}
        currentConversationId={conversation.id}
        onClose={() => actions.setForwardOpen(false)}
        onForward={(targetConversationId, comment) =>
          forwardSelected(targetConversationId, actions, comment, queryClient, onOpenTarget)
        }
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

async function forwardSelected(
  targetConversationId: string,
  actions: ThreadActions,
  comment: string,
  queryClient: QueryClient,
  onOpenTarget?: (conversationId: string) => void,
): Promise<void> {
  const result = await messengerCoreApi.forwardMessages(
    targetConversationId,
    actions.selectedMessages.map((row) => row.id),
    comment,
  );
  if (result.createdConversation !== false) return;
  applyMessengerSendResult(queryClient, 'INTERNAL', result.holder);
  if (result.commentMessage) {
    applyMessengerSendResult(queryClient, 'INTERNAL', result.commentMessage);
  }
  actions.clearSelection();
  onOpenTarget?.(targetConversationId);
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
